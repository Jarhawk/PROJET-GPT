-- =========================================================
-- PATCH: get_my_profile() -> forcer retour JSONB sans 42P13
-- Exécuter tel quel dans Supabase SQL Editor
-- =========================================================
set search_path = public;
set check_function_bodies = off;

-- Si get_my_profile() existe avec un autre type de retour que jsonb, on le remplace proprement
do $$
declare
  rt text;
begin
  select pg_catalog.pg_get_function_result(p.oid)
    into rt
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'get_my_profile'
    and p.pronargs = 0
  limit 1;

  if rt is not null and rt !~* '\bjsonb\b' then
    -- pas de CASCADE: on s'attend à zéro dépendance dure côté app
    execute 'drop function public.get_my_profile()';
  end if;
end
$$ language plpgsql;

-- (Re)création idempotente: retourne TOUJOURS un objet JSON (jamais de corps vide)
create or replace function public.get_my_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', u.id,
    'nom', u.nom,
    'access_rights', coalesce(u.access_rights, '{}'::jsonb),
    'mama_id', u.mama_id,
    'role_id', u.role_id
  )
  into result
  from public.utilisateurs u
  where u.auth_id = auth.uid()
  limit 1;

  if result is null then
    result := jsonb_build_object(
      'id', null,
      'nom', null,
      'access_rights', '{}'::jsonb,
      'mama_id', null,
      'role_id', null
    );
  end if;

  return result;
end;
$$;

grant execute on function public.get_my_profile() to authenticated;

-- =========================================================
-- FIN DU PATCH
-- =========================================================
