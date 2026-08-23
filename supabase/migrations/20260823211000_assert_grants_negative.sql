-- ---------------------------------------------------------------------------
-- Gegenprobe zum Waechter in 20260823210500.
--
-- Eine Behauptung, die immer zutrifft, beweist nichts. `has_function_privilege`
-- muss auch NEIN sagen koennen, sonst waere der Waechter davor wertlos.
--
-- generate_invite_code ist der Testfall: sie wurde entzogen und absichtlich nie
-- zurueckgegeben, weil sie ausschliesslich aus trips_before_insert heraus
-- aufgerufen wird — und die laeuft als security definer. Direkt aufrufbar soll
-- sie nicht sein: sonst koennte jede angemeldete Person beliebig viele
-- Einladungscodes erzeugen und den Vorrat durchprobieren.
--
-- Damit prueft dieses Paar beide Richtungen und haelt zugleich die Absicht
-- fest: diese Funktion bleibt gesperrt.
-- ---------------------------------------------------------------------------
do $$
begin
  if has_function_privilege('authenticated', 'public.generate_invite_code()', 'execute') then
    raise exception
      'generate_invite_code ist fuer authenticated ausfuehrbar. Das soll sie nicht sein — und der Waechter in 20260823210500 kann dann auch nichts erkennen.';
  end if;
end $$;
