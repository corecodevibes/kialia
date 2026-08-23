-- ---------------------------------------------------------------------------
-- Waechter fuer Ausfuehrungsrechte.
--
-- Diese Klasse Fehler ist zum zweiten Mal passiert und beide Male erst beim
-- Nutzer aufgefallen: ein `revoke ... from public` ohne passendes
-- `grant ... to authenticated`. Das faellt beim Schreiben der Migration nicht
-- auf, weil sie fehlerfrei durchlaeuft, und in der Anwendung erst dort, wo die
-- Funktion tatsaechlich aufgerufen wird — moeglicherweise Wochen spaeter.
--
-- Deshalb hier eine Behauptung statt eines Kommentars: fehlt ein Recht,
-- schlaegt die Migration fehl und nicht der Nutzer.
-- ---------------------------------------------------------------------------
do $$
declare
  fehlend text[] := array[]::text[];
  f text;
begin
  foreach f in array array[
    'public.is_trip_member(uuid)',
    'public.join_trip(text)',
    'public.delete_own_account()'
  ] loop
    if not has_function_privilege('authenticated', f, 'execute') then
      fehlend := fehlend || f;
    end if;
  end loop;

  if array_length(fehlend, 1) > 0 then
    raise exception
      'Rolle authenticated fehlt EXECUTE auf: %. Ohne das scheitern die Regeln auf public.trips zur Laufzeit.',
      array_to_string(fehlend, ', ');
  end if;
end $$;
