set search_path = public;
set check_function_bodies = off;

create or replace function public.jwt_claim(claim text)
returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> claim,
    nullif(current_setting('jwt.claims',     true), '')::jsonb ->> claim
  );
$$;

create or replace function public.current_user_mama_id()
returns uuid language plpgsql stable security definer
set search_path = public
as $$
declare v uuid;
begin
  v := nullif(public.jwt_claim('mama_id'), '')::uuid;
  if v is not null then return v; end if;
  select u.mama_id into v from public.utilisateurs u where u.auth_id = auth.uid() limit 1;
  return v;
end;
$$;
grant execute on function public.current_user_mama_id() to authenticated;

do $$
declare rt text;
begin
  select pg_get_function_result(p.oid) into rt
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='get_my_profile' and p.pronargs=0
  limit 1;
  if rt is not null and rt !~* '\\bjsonb\\b' then
    execute 'drop function public.get_my_profile()';
  end if;
end
$$ language plpgsql;

create or replace function public.get_my_profile()
returns jsonb language plpgsql stable security definer
set search_path = public
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'id', u.id, 'nom', u.nom,
    'access_rights', coalesce(u.access_rights,'{}'::jsonb),
    'mama_id', u.mama_id, 'role_id', u.role_id
  )
  into result
  from public.utilisateurs u
  where u.auth_id = auth.uid()
  limit 1;

  if result is null then
    result := jsonb_build_object('id',null,'nom',null,'access_rights','{}'::jsonb,'mama_id',null,'role_id',null);
  end if;
  return result;
end;
$$;
grant execute on function public.get_my_profile() to authenticated;

do $$
begin
  if to_regprocedure('public.bootstrap_my_profile(text)') is null
     and to_regprocedure('public.bootstrap_my_profile()') is not null then
    execute 'drop function public.bootstrap_my_profile()';
  end if;
end
$$ language plpgsql;

create or replace function public.bootstrap_my_profile(p_nom text default null)
returns jsonb language plpgsql security definer
set search_path = public
as $$
declare v_auth uuid := auth.uid(); v_mama uuid; v_row public.utilisateurs%rowtype;
begin
  if v_auth is null then raise exception 'No session'; end if;
  select * into v_row from public.utilisateurs where auth_id=v_auth limit 1;
  if not found then
    v_mama := nullif(public.jwt_claim('mama_id'), '')::uuid;
    if v_mama is null then select id into v_mama from public.mamas order by id limit 1; end if;
    if v_mama is null then raise exception 'Aucun mama_id disponible'; end if;
    insert into public.utilisateurs (auth_id, nom, access_rights, mama_id, role_id)
    values (v_auth, coalesce(p_nom,''), '{}'::jsonb, v_mama, null)
    returning * into v_row;
  end if;
  return jsonb_build_object(
    'id', v_row.id, 'nom', v_row.nom, 'access_rights', coalesce(v_row.access_rights,'{}'::jsonb),
    'mama_id', v_row.mama_id, 'role_id', v_row.role_id
  );
end;
$$;
grant execute on function public.bootstrap_my_profile(text) to authenticated;

do $$
begin
  if to_regclass('public.utilisateurs') is not null then
    execute 'alter table public.utilisateurs enable row level security';
    if not exists (select 1 from pg_policies where schemaname=''public'' and tablename=''utilisateurs'' and policyname=''utilisateurs_select'') then
      execute $q$create policy utilisateurs_select on public.utilisateurs for select using (auth.uid()=auth_id)$q$;
    end if;
  end if;
end
$$ language plpgsql;
