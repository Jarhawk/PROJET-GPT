-- =========================================================
-- OVERLAY AUTH & ACCESS (app-safe, idempotent) — à coller dans le SQL Editor
-- NE CRÉE PAS de tables; ne fait que fonctions/GRANTs/policies sûres
-- =========================================================
set search_path = public;
set check_function_bodies = off;

-- 1) Helpers JWT
create or replace function public.jwt_claim(claim text)
returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> claim,
    nullif(current_setting('jwt.claims',     true), '')::jsonb ->> claim
  );
$$;

-- 2) current_user_mama_id avec fallback table (SECURITY DEFINER)
create or replace function public.current_user_mama_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare v uuid;
begin
  v := nullif(public.jwt_claim('mama_id'), '')::uuid;
  if v is not null then return v; end if;

  select u.mama_id into v
  from public.utilisateurs u
  where u.auth_id = auth.uid()
  limit 1;

  return v;
end;
$$;
grant execute on function public.current_user_mama_id() to authenticated;

-- 3) get_my_profile => JSON objet (jamais vide); drop conditionnel si autre signature
do $$
declare rt text;
begin
  select pg_get_function_result(p.oid)
    into rt
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public' and p.proname='get_my_profile' and p.pronargs=0
  limit 1;

  if rt is not null and rt !~* '\\bjsonb\\b' then
    execute 'drop function public.get_my_profile()';
  end if;
end
$$ language plpgsql;

create or replace function public.get_my_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare result jsonb;
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
      'id', null, 'nom', null, 'access_rights', '{}'::jsonb, 'mama_id', null, 'role_id', null
    );
  end if;
  return result;
end;
$$;
grant execute on function public.get_my_profile() to authenticated;

-- 4) bootstrap_my_profile (idempotent)
create or replace function public.bootstrap_my_profile(p_nom text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.utilisateurs (auth_id, nom)
  values (auth.uid(), p_nom)
  on conflict (auth_id) do update
    set nom = coalesce(excluded.nom, public.utilisateurs.nom);
end;
$$;
grant execute on function public.bootstrap_my_profile(text) to authenticated;

-- =========================================================
-- FIN DU SCRIPT
-- =========================================================
