-- Reisen teilen: eine Reise, mehrere Mitglieder.
--
-- Die Reise wird als EIN JSONB-Dokument gespeichert, nicht als zehn Tabellen.
-- Begruendung: eine Reise ist ein Dokument, das wenige Menschen gemeinsam
-- bearbeiten. Es gibt keine Abfragen ueber einzelne Posten, keine Auswertungen
-- ueber Reisen hinweg. Ein Dokument spart das gesamte Beziehungsmodell und
-- haelt Client und Datenbank in derselben Form.

create table public.trips (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users on delete cascade,
  -- Wird vom BEFORE-INSERT-Trigger vergeben; der Client darf die Spalte
  -- nicht setzen. BEFORE-Trigger laufen vor der NOT-NULL-Pruefung, deshalb
  -- vertragen sich beide.
  invite_code  text not null unique,
  data         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Wer zuletzt gespeichert hat. Bei gleichzeitiger Bearbeitung gewinnt die
  -- letzte Fassung; wenigstens soll nachvollziehbar sein, wessen.
  updated_by   uuid references auth.users on delete set null
);

create table public.trip_members (
  trip_id    uuid not null references public.trips on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  joined_at  timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index trip_members_user_idx on public.trip_members (user_id);
create index trips_updated_idx on public.trips (updated_at desc);

-- ---------------------------------------------------------------------------
-- Mitgliedschaft pruefen
--
-- Als SECURITY DEFINER, weil die Policy auf trips sonst trip_members abfragt,
-- deren Policy wieder trips abfragt — eine Endlosschleife, die Postgres mit
-- "infinite recursion detected in policy" abbricht.
-- ---------------------------------------------------------------------------
create or replace function public.is_trip_member(p_trip uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Einladungscode: kurz, vorlesbar, ohne verwechselbare Zeichen (kein O/0/I/1).
-- ---------------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for _ in 1..8 loop
      code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.trips t where t.invite_code = code);
  end loop;
  return code;
end;
$$;

-- Der Code wird von der Datenbank vergeben, nicht vom Client: die Spalte ist
-- NOT NULL, steht aber bewusst nicht in den INSERT-Rechten. Ohne diesen Trigger
-- wuerde jedes Anlegen an der NOT-NULL-Bedingung scheitern.
create or replace function public.trips_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.invite_code is null or new.invite_code = '' then
    new.invite_code := public.generate_invite_code();
  end if;
  return new;
end;
$$;

create trigger trips_set_code
  before insert on public.trips
  for each row execute function public.trips_before_insert();

-- Wer eine Reise anlegt, ist automatisch ihr erstes Mitglied. Ohne das koennte
-- der Ersteller seine eigene Reise nicht mehr lesen — die Policy verlangt
-- Mitgliedschaft, nicht Eigentum.
create or replace function public.trips_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger trips_add_owner
  after insert on public.trips
  for each row execute function public.trips_after_insert();

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Beitreten ueber den Code
--
-- SECURITY DEFINER, weil der Beitretende die Reise noch NICHT lesen darf — die
-- Policy verlangt ja Mitgliedschaft. Die Funktion prueft den Code selbst und
-- traegt nur den aufrufenden Nutzer ein, niemals einen fremden.
-- ---------------------------------------------------------------------------
create or replace function public.join_trip(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  select t.id into v_trip
  from public.trips t
  where upper(t.invite_code) = upper(trim(p_code));

  if v_trip is null then
    raise exception 'Dieser Code gehört zu keiner Reise';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_trip, auth.uid(), 'editor')
  on conflict do nothing;

  return v_trip;
end;
$$;

-- ---------------------------------------------------------------------------
-- Rechte
--
-- "Automatically expose new tables" ist im Projekt aus, deshalb jede Freigabe
-- ausdruecklich. Beim Anlegen bewusst nur die Spalten, die der Client setzen
-- darf: id, invite_code, created_at, updated_at und updated_by gehoeren der
-- Datenbank.
-- ---------------------------------------------------------------------------
grant select, update (data), insert (owner_id, data), delete on public.trips to authenticated;
grant select, delete on public.trip_members to authenticated;

-- Funktionen sind standardmaessig fuer PUBLIC ausfuehrbar — das gilt auch fuer
-- anonyme Aufrufe. Erst entziehen, dann gezielt freigeben.
revoke execute on function public.is_trip_member(uuid) from public;
revoke execute on function public.join_trip(text) from public;
revoke execute on function public.generate_invite_code() from public;
grant execute on function public.join_trip(text) to authenticated;

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;

create policy "Mitglieder sehen ihre Reise" on public.trips
  for select to authenticated using (public.is_trip_member(id));

create policy "Mitglieder bearbeiten ihre Reise" on public.trips
  for update to authenticated
  using (public.is_trip_member(id))
  with check (public.is_trip_member(id));

-- Eine Reise darf man nur auf den eigenen Namen anlegen.
create policy "Eigene Reise anlegen" on public.trips
  for insert to authenticated with check (owner_id = auth.uid());

-- Loeschen bleibt beim Eigentuemer: wer beitritt, soll die Reise der anderen
-- nicht wegloeschen koennen.
create policy "Nur der Eigentümer löscht" on public.trips
  for delete to authenticated using (owner_id = auth.uid());

create policy "Mitglieder sehen die Mitgliederliste" on public.trip_members
  for select to authenticated using (public.is_trip_member(trip_id));

-- Austreten darf jeder für sich selbst; den Eigentümer kann niemand entfernen.
create policy "Selbst austreten" on public.trip_members
  for delete to authenticated using (user_id = auth.uid() and role <> 'owner');

-- Live-Aktualisierung: aendert eine Person etwas, sehen es die anderen ohne
-- Neuladen. Ohne diese Zeile liefert Supabase Realtime fuer die Tabelle nichts.
alter publication supabase_realtime add table public.trips;
