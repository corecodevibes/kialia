-- Der Eigentuemer muss seine Reise IMMER lesen duerfen.
--
-- Der Fehler: die SELECT-Policy verlangte Mitgliedschaft, die Mitgliedschaft
-- entsteht aber erst im AFTER-INSERT-Trigger. Ein `insert ... returning` wird
-- ausgewertet, bevor der Trigger fertig ist — der Client bekam also nie die id
-- seiner eigenen, gerade angelegten Reise zurueck.
--
-- Folge: er hielt jedes Hochladen fuer gescheitert und legte bei jedem
-- Abgleich eine weitere Kopie an.

drop policy if exists "Mitglieder sehen ihre Reise" on public.trips;

create policy "Mitglieder und Eigentümer sehen die Reise" on public.trips
  for select to authenticated
  using (owner_id = auth.uid() or public.is_trip_member(id));

-- Dasselbe beim Bearbeiten: sonst koennte der Eigentuemer in genau dem Moment
-- zwischen Insert und Trigger nicht schreiben.
drop policy if exists "Mitglieder bearbeiten ihre Reise" on public.trips;

create policy "Mitglieder und Eigentümer bearbeiten die Reise" on public.trips
  for update to authenticated
  using (owner_id = auth.uid() or public.is_trip_member(id))
  with check (owner_id = auth.uid() or public.is_trip_member(id));

-- ---------------------------------------------------------------------------
-- Aufraeumen der Kopien, die durch den Fehler entstanden sind.
--
-- Erkennungsmerkmal: gleicher Eigentuemer UND gleiche lokale Reise-id im
-- Dokument (data->>'id'). Behalten wird die zuletzt geaenderte Fassung, weil
-- spaetere Kopien mehr Inhalt haben.
--
-- Bewusst konservativ: nur Zeilen mit einem echten Duplikat werden geloescht,
-- Einzelstuecke bleiben unangetastet.
-- ---------------------------------------------------------------------------
delete from public.trips t
where t.data ? 'id'
  and exists (
    select 1 from public.trips other
    where other.owner_id = t.owner_id
      and other.data->>'id' = t.data->>'id'
      and (other.updated_at, other.id) > (t.updated_at, t.id)
  );
