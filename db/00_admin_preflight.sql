-- db/00_admin_preflight.sql
-- A exécuter en Service role (postgres) AVANT db/00_admin_only.sql

set search_path = public, pg_catalog;

-- Vérif de contexte
select current_user as user, session_user, current_schema;

-- Ownership + droits schéma 'public'
alter schema public owner to postgres;
grant usage, create on schema public to postgres;

-- Lecture du schéma pour les rôles applicatifs
grant usage on schema public to authenticated;
grant usage on schema public to anon;

-- Par défaut, exécution des fonctions pour authenticated
alter default privileges for role postgres in schema public
  grant execute on functions to authenticated;

-- (optionnel) diagnostic
select n.nspname as schema, pg_catalog.pg_get_userbyid(n.nspowner) as owner
from pg_namespace n where n.nspname='public';

select has_schema_privilege('public','USAGE')  as has_usage,
       has_schema_privilege('public','CREATE') as has_create;
