-- ---------------------------------------------------------------------------
-- Eine Reise verlassen — und sie nur dann wirklich loeschen, wenn niemand mehr
-- drin ist.
--
-- Vorher gab es das gar nicht: der Client entfernte die Reise nur aus dem
-- eigenen Speicher, der Server erfuhr nichts, und der naechste Abgleich holte
-- sie zurueck. Eine geteilte Reise liess sich also nicht loeschen.
--
-- Das Modell hier ist "der Letzte macht das Licht aus":
--   * Wer loescht, verliert die Reise fuer sich.
--   * Die anderen behalten sie unveraendert — sie haben sie mitgeplant, und
--     dass eine Person aufraeumt, ist kein Grund, ihnen die Reise wegzunehmen.
--   * Ist niemand mehr Mitglied, verschwindet die Reise samt Daten.
--
-- Sonderfall Eigentuemer: verlaesst er eine Reise, an der noch andere haengen,
-- muss die Eigentuemerschaft weiterwandern. Sonst bliebe eine Zeile mit einem
-- Eigentuemer zurueck, der kein Mitglied mehr ist — und der saehe sie ueber die
-- Eigentuemer-Regel weiterhin, obwohl er sie gerade entfernt hat.
--
-- security definer, weil die Loesch-Regel auf trips absichtlich nur den
-- Eigentuemer laesst. Der Zugriff wird hier von Hand geprueft.
-- ---------------------------------------------------------------------------
create or replace function public.leave_trip(p_trip uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me       uuid := auth.uid();
  nachfolger uuid;
  war_eigner boolean;
begin
  if me is null then
    raise exception 'Nicht angemeldet.';
  end if;

  select (owner_id = me) into war_eigner from public.trips where id = p_trip;

  if war_eigner is null then
    -- Die Reise gibt es nicht (mehr). Kein Fehler: das Ziel ist erreicht.
    return 'deleted';
  end if;

  if not war_eigner and not public.is_trip_member(p_trip) then
    raise exception 'Kein Zugriff auf diese Reise.';
  end if;

  delete from public.trip_members where trip_id = p_trip and user_id = me;

  select user_id into nachfolger
  from public.trip_members
  where trip_id = p_trip
  order by joined_at
  limit 1;

  if nachfolger is null then
    -- Niemand mehr da. Die Mitgliederzeilen haengen per Fremdschluessel mit
    -- "on delete cascade" an der Reise und verschwinden mit ihr.
    delete from public.trips where id = p_trip;
    return 'deleted';
  end if;

  if war_eigner then
    update public.trips set owner_id = nachfolger where id = p_trip;
    update public.trip_members set role = 'owner'
    where trip_id = p_trip and user_id = nachfolger;
  end if;

  return 'left';
end $$;

revoke execute on function public.leave_trip(uuid) from public;
grant  execute on function public.leave_trip(uuid) to authenticated;
