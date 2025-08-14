-- Correction des policies et vues/fonctions utilisant current_user_mama_id
set search_path = public, pg_catalog;

do $$
declare r record;
begin
  -- Réécriture des policies avec sous-requêtes vers utilisateurs
  for r in (
      select schemaname, tablename, policyname
      from pg_policies
      where policydef ilike '%select%'
        and policydef ilike '%utilisateurs%'
  ) loop
      execute format('alter table %I.%I drop policy if exists %I;',
                     r.schemaname, r.tablename, r.policyname);
      execute format(
          'create policy %I on %I.%I for all using (mama_id = current_user_mama_id());',
          r.policyname, r.schemaname, r.tablename
      );
  end loop;

  -- Reconstruction des vues utilisant current_user_mama_id
  for r in (
      select schemaname as obj_schema,
             viewname as obj_name,
             definition
      from pg_views
      where definition ilike '%current_user_mama_id%'
  ) loop
      execute format('drop view if exists %I.%I cascade;', r.obj_schema, r.obj_name);
      execute format('create or replace view %I.%I as %s;', r.obj_schema, r.obj_name, r.definition);
  end loop;

  -- Reconstruction des fonctions utilisant current_user_mama_id
  for r in (
      select n.nspname as obj_schema,
             p.proname as obj_name,
             pg_get_functiondef(p.oid) as definition,
             pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where pg_get_functiondef(p.oid) ilike '%current_user_mama_id%'
        and n.nspname not in ('pg_catalog', 'information_schema')
  ) loop
      execute format('drop function if exists %I.%I(%s);', r.obj_schema, r.obj_name, r.args);
      execute r.definition;
  end loop;
end;
$$ language plpgsql;
