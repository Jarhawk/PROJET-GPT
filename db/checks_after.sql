-- db/checks_after.sql
-- Extensions admin
select name, installed_version
from pg_available_extensions
where name in ('pgcrypto','pg_net');

-- Fonctions admin attendues
select n.nspname as schema, p.proname as function
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname in (
    'current_user_mama_id',
    'current_user_is_admin_or_manager',
    'current_user_is_admin',
    'create_utilisateur',
    'can_access_zone',
    'log_action'
  )
order by 1,2;

-- Policies spécifiques
select schemaname, tablename, policyname
from pg_policies
where policyname in ('zones_stock_select','user_mama_access_select')
order by 1,2,3;

-- RLS activée (adapter la liste)
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname='public'
  and tablename in ('utilisateurs','fournisseurs','produits','factures','facture_lignes')
order by 1,2;

-- Aucune fausse fonction auth.uid
select n.nspname, p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname='auth' and p.proname='uid';
