-- 00_admin_only.sql
-- À exécuter via service role (Admin) dans Supabase.
-- Contient : extensions, rôles, fonctions/triggers touchant auth.*, pg_net, storage.*, grants admin-only.
-- Idempotent. NE JAMAIS redéfinir auth.uid() ici.
-- 1. Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_net";

do $do$
begin
  if to_regclass('public.utilisateurs') is not null then
    execute $fn$
      create or replace function public.current_user_mama_id()
      returns uuid
      language sql stable as $$
        select u.mama_id
        from public.utilisateurs u
        where u.auth_id = auth.uid()
        limit 1
      $$;
    $fn$;
  else
    raise notice 'Skip current_user_mama_id(): table public.utilisateurs absente';
  end if;
end;
$do$ language plpgsql;

do $do$
begin
  if to_regclass('public.utilisateurs') is not null and to_regclass('public.roles') is not null then
    execute $fn$
      create or replace function public.current_user_is_admin_or_manager()
      returns boolean
      language sql stable as $$
        select exists (
          select 1
          from public.utilisateurs u
          join public.roles r on r.id = u.role_id
          where u.auth_id = auth.uid()
            and r.nom in ('admin','manager')
        )
      $$;
    $fn$;
  else
    raise notice 'Skip current_user_is_admin_or_manager(): tables utilisateurs/roles absentes';
  end if;
end;
$do$ language plpgsql;

do $do$
begin
  if to_regclass('public.utilisateurs') is not null and to_regclass('public.roles') is not null then
    execute $fn$
      create or replace function public.current_user_is_admin()
      returns boolean
      language sql stable as $$
        select public.current_user_is_admin_or_manager() and exists (
          select 1
          from public.utilisateurs u
          join public.roles r on r.id = u.role_id
          where u.auth_id = auth.uid()
            and r.nom = 'admin'
        )
      $$;
    $fn$;
  else
    raise notice 'Skip current_user_is_admin(): tables utilisateurs/roles absentes';
  end if;
end;
$do$ language plpgsql;
create or replace function public.create_utilisateur(
  p_email text,
  p_nom text,
  p_role_id uuid,
  p_mama_id uuid
) returns json
language plpgsql
security definer as $$
declare
  v_auth_id uuid;
  v_password text;
begin
  if exists(select 1 from auth.users where lower(email) = lower(p_email)) then
    raise exception 'email exists';
  end if;
  v_password := encode(gen_random_bytes(9), 'base64');
  insert into auth.users(email, encrypted_password)
  values (p_email, crypt(v_password, gen_salt('bf'))) returning id into v_auth_id;
  insert into public.utilisateurs(nom, email, auth_id, role_id, mama_id, actif)
  values(p_nom, p_email, v_auth_id, p_role_id, p_mama_id, true);
  perform net.http_post(
    url => 'https://example.com/send',
    body => jsonb_build_object('email', p_email, 'password', v_password)
  );
  return json_build_object('success', true);
exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;$$;

  do $do$
  begin
    if to_regclass('public.zones_stock') is not null then
      if not exists (
        select 1 from pg_policies
        where schemaname='public' and tablename='zones_stock' and policyname='zones_stock_select'
      ) then
        execute $pol$
          create policy zones_stock_select
          on public.zones_stock
          for select
          using (
            mama_id = current_user_mama_id()
            and exists (
              select 1
              from public.zones_droits zd
              where zd.zone_id = zones_stock.id
                and zd.user_id = auth.uid()
                and zd.lecture = true
                and zd.mama_id = zones_stock.mama_id
            )
          );
        $pol$;
      end if;
    else
      raise notice 'Skip policy zones_stock_select: table public.zones_stock absente -- TODO: dépendance manquante';
    end if;
  end;
  $do$ language plpgsql;
create or replace function public.can_access_zone(p_zone uuid, p_mode text default 'lecture')
returns boolean
language sql stable security definer
as $$
  select case
    when p_mode = 'lecture' then exists(select 1 from public.zones_droits where zone_id=p_zone and user_id=auth.uid() and lecture=true)
    when p_mode = 'ecriture' then exists(select 1 from public.zones_droits where zone_id=p_zone and user_id=auth.uid() and ecriture=true)
    when p_mode = 'transfert' then exists(select 1 from public.zones_droits where zone_id=p_zone and user_id=auth.uid() and transfert=true)
    when p_mode = 'requisition' then exists(select 1 from public.zones_droits where zone_id=p_zone and user_id=auth.uid() and requisition=true)
      else false end;
$$;
do $do$
begin
  if to_regclass('public.user_mama_access') is not null then
    if not exists (
      select 1
      from pg_policies
      where schemaname='public'
        and tablename='user_mama_access'
        and policyname='user_mama_access_select'
    ) then
      execute $pol$
        create policy user_mama_access_select
        on public.user_mama_access
        for select
        using (user_id = auth.uid());
      $pol$;
    end if;
  else
    raise notice 'Skip policy user_mama_access_select: table public.user_mama_access absente';
  end if;
end;
$do$ language plpgsql;
create or replace function public.log_action(
  p_mama_id uuid,
  p_type text,
  p_module text,
  p_description text,
  p_donnees jsonb default '{}'::jsonb,
  p_critique boolean default false
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.logs_activite(mama_id, user_id, type, module, description, donnees, critique)
  values (p_mama_id, auth.uid(), p_type, p_module, p_description, p_donnees, p_critique);
end;
$$;
do $do$
begin
  if to_regprocedure('public.current_user_mama_id()') is not null then
    execute 'grant execute on function public.current_user_mama_id() to authenticated';
  end if;
  if to_regprocedure('public.current_user_is_admin_or_manager()') is not null then
    execute 'grant execute on function public.current_user_is_admin_or_manager() to authenticated';
  end if;
  if to_regprocedure('public.current_user_is_admin()') is not null then
    execute 'grant execute on function public.current_user_is_admin() to authenticated';
  end if;
  if to_regprocedure('public.create_utilisateur(text, text, uuid, uuid)') is not null then
    execute 'grant execute on function public.create_utilisateur(text, text, uuid, uuid) to authenticated';
  end if;
  if to_regprocedure('public.can_access_zone(uuid, text)') is not null then
    execute 'grant execute on function public.can_access_zone(uuid, text) to authenticated';
  end if;
  if to_regprocedure('public.log_action(uuid, text, text, text, jsonb, boolean)') is not null then
    execute 'grant execute on function public.log_action(uuid, text, text, text, jsonb, boolean) to authenticated';
  end if;
end;
$do$ language plpgsql;
