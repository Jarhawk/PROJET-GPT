-- Schéma
select table_schema, table_name, column_name, data_type
from information_schema.columns
where table_schema='public'
order by 1,2,3;

-- Index
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname='public'
order by 1,2,3;

-- Comptes de lignes (adapter la liste si besoin)
select 'utilisateurs'::text as table, count(*) from public.utilisateurs
union all select 'roles', count(*) from public.roles
union all select 'produits', count(*) from public.produits
union all select 'fournisseurs', count(*) from public.fournisseurs
union all select 'factures', count(*) from public.factures
union all select 'facture_lignes', count(*) from public.facture_lignes
union all select 'zones_stock', count(*) from public.zones_stock
union all select 'zones_droits', count(*) from public.zones_droits
union all select 'user_mama_access', count(*) from public.user_mama_access
union all select 'logs_activite', count(*) from public.logs_activite;
