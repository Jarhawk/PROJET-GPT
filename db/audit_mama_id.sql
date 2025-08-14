-- Audit des vues/fonctions et policies utilisant current_user_mama_id

-- Vues et fonctions contenant current_user_mama_id
select obj_type,
       obj_schema,
       obj_name
from (
    select 'view' as obj_type,
           schemaname as obj_schema,
           viewname as obj_name,
           definition
    from pg_views
    where definition ilike '%current_user_mama_id%'
    union all
    select 'function' as obj_type,
           n.nspname as obj_schema,
           p.proname as obj_name,
           pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where pg_get_functiondef(p.oid) ilike '%current_user_mama_id%'
      and n.nspname not in ('pg_catalog', 'information_schema')
) s
order by obj_type, obj_schema, obj_name;

-- Policies contenant des sous-requêtes vers utilisateurs
select schemaname,
       tablename,
       policyname,
       policydef
from pg_policies
where policydef ilike '%select%'
  and policydef ilike '%utilisateurs%'
order by schemaname, tablename, policyname;
