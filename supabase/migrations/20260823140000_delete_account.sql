-- Konto vollstaendig loeschen.
--
-- Warum als Funktion in der Datenbank: der Client darf auth.users nicht
-- anfassen, und der service_role-Key gehoert nicht in eine App. Eine
-- SECURITY-DEFINER-Funktion loescht genau den aufrufenden Nutzer — und nur
-- den. Es gibt keinen Parameter, den man faelschen koennte.
--
-- Ohne diesen Weg gibt es keine Kontoloeschung in der App, und das ist bei
-- Apple ein Ablehnungsgrund, sobald eine App Konten anlegt.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Nicht angemeldet';
  end if;

  -- Reisen, die dem Nutzer gehoeren, verschwinden mit ihm — auch fuer
  -- Mitreisende. Das ist die ehrliche Folge: es sind seine Daten, und ein
  -- verwaistes Dokument ohne Eigentuemer waere niemandem gedient.
  delete from public.trips where owner_id = v_user;

  -- Mitgliedschaften in fremden Reisen: nur die eigene Zeile.
  delete from public.trip_members where user_id = v_user;

  -- profiles haengt per ON DELETE CASCADE an auth.users, wird also mitgeloescht.
  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
