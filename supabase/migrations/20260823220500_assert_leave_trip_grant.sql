-- Der Waechter aus 20260823210500, erweitert um die neue Funktion. Ohne diese
-- Zeile wuerde genau der Fehler wieder moeglich, den er verhindern soll.
do $$
begin
  if not has_function_privilege('authenticated', 'public.leave_trip(uuid)', 'execute') then
    raise exception 'Rolle authenticated fehlt EXECUTE auf public.leave_trip(uuid).';
  end if;
end $$;
