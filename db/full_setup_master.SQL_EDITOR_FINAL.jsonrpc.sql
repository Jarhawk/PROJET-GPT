-- =========================================================
-- MAMASTOCK — SQL EDITOR OVERLAY (app-safe, idempotent)
-- Coller tel quel dans Supabase SQL Editor
-- =========================================================
set search_path = public;
set check_function_bodies = off;

-- 1) Helpers JWT-only (aucun accès table)
create or replace function public.jwt_claim(claim text)
returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> claim,
    nullif(current_setting('jwt.claims',     true), '')::jsonb ->> claim
  );
$$;

create or replace function public.current_user_id()
returns uuid language sql stable as $$
  select nullif(public.jwt_claim('sub'), '')::uuid;
$$;

create or replace function public.current_user_mama_id()
returns uuid language sql stable as $$
  select nullif(public.jwt_claim('mama_id'), '')::uuid;
$$;

create or replace function public.current_user_role()
returns text language sql stable as $$
  select nullif(public.jwt_claim('role'), '');
$$;

create or replace function public.current_user_is_admin()
returns boolean language sql stable as $$
  select coalesce((public.jwt_claim('is_admin'))::boolean, false);
$$;

create or replace function public.current_user_is_admin_or_manager()
returns boolean language sql stable as $$
  select coalesce((public.jwt_claim('is_admin'))::boolean, false)
         or public.jwt_claim('role') = 'manager';
$$;

grant execute on function public.jwt_claim(text)                    to authenticated;
grant execute on function public.current_user_id()                  to authenticated;
grant execute on function public.current_user_mama_id()             to authenticated;
grant execute on function public.current_user_role()                to authenticated;
grant execute on function public.current_user_is_admin()            to authenticated;
grant execute on function public.current_user_is_admin_or_manager() to authenticated;

-- 2) Trigger updated_at + rattachement auto (sans DROP CASCADE)
create or replace function public.trg_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
grant execute on function public.trg_set_timestamp() to authenticated;

do $$
declare r record;
begin
  for r in (
    select c.table_schema, c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name  = 'updated_at'
      and t.table_type   = 'BASE TABLE'
  ) loop
    begin
      if not exists (
        select 1
        from pg_trigger tg
        join pg_class  rc on rc.oid = tg.tgrelid
        join pg_namespace rn on rn.oid = rc.relnamespace
        where rn.nspname = r.table_schema
          and rc.relname = r.table_name
          and tg.tgname = format('trg_%s_updated_at', r.table_name)
      ) then
        execute format(
          'create trigger %I before update on %I.%I
             for each row execute function public.trg_set_timestamp();',
          'trg_' || r.table_name || '_updated_at', r.table_schema, r.table_name
        );
      end if;
    exception when others then
      raise notice 'Skip trigger on %.%: %', r.table_schema, r.table_name, sqlerrm;
    end;
  end loop;
end
$$ language plpgsql;

-- 3) RLS normalisée (jamais sur VUES)
-- 3a) utilisateurs : SELECT self via auth.uid() = auth_id
do $$
declare pol record;
begin
  if to_regclass('public.utilisateurs') is not null then
    execute 'alter table public.utilisateurs enable row level security';
    for pol in
      select policyname from pg_policies
      where schemaname='public' and tablename='utilisateurs'
    loop
      execute format('drop policy %I on public.utilisateurs;', pol.policyname);
    end loop;
    execute $q$
      create policy utilisateurs_select
      on public.utilisateurs
      for select
      using (auth.uid() = auth_id)
    $q$;
  end if;
end
$$ language plpgsql;

-- 3b) mamas : FOR ALL (id = current_user_mama_id())
do $$
declare pol record;
begin
  if to_regclass('public.mamas') is not null then
    execute 'alter table public.mamas enable row level security';
    for pol in
      select policyname from pg_policies
      where schemaname='public' and tablename='mamas'
    loop
      execute format('drop policy %I on public.mamas;', pol.policyname);
    end loop;
    execute $q$
      create policy mamas_all
      on public.mamas
      for all
      using (id = public.current_user_mama_id())
      with check (id = public.current_user_mama_id())
    $q$;
  end if;
end
$$ language plpgsql;

-- 3c) toutes les autres BASE TABLES avec colonne mama_id : FOR ALL par mama_id
do $$
declare r_tbl record; pol record;
begin
  for r_tbl in
    select tt.table_name
    from information_schema.tables tt
    where tt.table_schema='public'
      and tt.table_type='BASE TABLE'
      and tt.table_name not in ('utilisateurs','mamas')
      and exists (
        select 1 from information_schema.columns c
        where c.table_schema='public'
          and c.table_name = tt.table_name
          and c.column_name = 'mama_id'
      )
  loop
    execute format('alter table public.%I enable row level security;', r_tbl.table_name);
    for pol in
      select policyname from pg_policies
      where schemaname='public' and tablename=r_tbl.table_name
    loop
      execute format('drop policy %I on public.%I;', pol.policyname, r_tbl.table_name);
    end loop;
    execute format(
      $q$create policy %I_mama_rls on public.%I
         for all using (mama_id = public.current_user_mama_id())
         with check (mama_id = public.current_user_mama_id())$q$,
      r_tbl.table_name, r_tbl.table_name
    );
  end loop;
end
$$ language plpgsql;

-- 4) RPC profil — retourne TOUJOURS un objet JSON (jsonb)
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

-- 5) Fonctions optionnelles : créer uniquement si absentes (éviter 42P13)
-- calcul_ecarts_inventaire(date,text,uuid)
do $$
begin
  if to_regprocedure('public.calcul_ecarts_inventaire(date,text,uuid)') is null then
    execute $q$
      create function public.calcul_ecarts_inventaire(p_date date, p_zone text, mama_id_param uuid)
      returns table(produit text, stock_theorique numeric, stock_reel numeric, ecart numeric, motif text)
      as $func$
      begin
        raise notice 'TODO';
        return;
      end;
      $func$ language plpgsql;
    $q$;
  else
    raise notice 'Skip create calcul_ecarts_inventaire: already exists';
  end if;
end
$$ language plpgsql;

-- fn_calc_budgets(uuid,text)
do $$
begin
  if to_regprocedure('public.fn_calc_budgets(uuid,text)') is null then
    execute $q$
      create function public.fn_calc_budgets(mama_id_param uuid, periode_param text)
      returns table(famille text, ecart_pct numeric)
      as $func$
      begin
        raise notice 'TODO';
        return;
      end;
      $func$ language plpgsql;
    $q$;
  else
    raise notice 'Skip create fn_calc_budgets: already exists';
  end if;
end
$$ language plpgsql;

-- GRANTs conditionnels pour ces 2 fonctions (si présentes)
do $$
begin
  if to_regprocedure('public.calcul_ecarts_inventaire(date,text,uuid)') is not null then
    execute 'grant execute on function public.calcul_ecarts_inventaire(date, text, uuid) to authenticated';
  end if;
  if to_regprocedure('public.fn_calc_budgets(uuid,text)') is not null then
    execute 'grant execute on function public.fn_calc_budgets(uuid, text) to authenticated';
  end if;
end
$$ language plpgsql;

-- 6) Vue utilitaire (créée seulement si les tables existent, jamais RLS sur vues)
do $$
begin
  if to_regclass('public.sous_familles') is not null
     and to_regclass('public.familles')      is not null then
    execute 'drop view if exists public.v_familles_sous_familles';
    execute $q$
      create view public.v_familles_sous_familles as
      select sf.*, f.nom as famille_nom
      from public.sous_familles sf
      join public.familles f on f.id = sf.famille_id
    $q$;
  else
    raise notice 'Skip v_familles_sous_familles (tables manquantes)';
  end if;
end
$$ language plpgsql;

-- ============================== FIN OVERLAY ==============================
