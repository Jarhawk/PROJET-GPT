-- SCRIPT COMPATIBLE SUPABASE — AUCUNE OPÉRATION INTERDITE — PRÊT À L’IMPORT
-- full_setup.sql - Schéma complet MamaStock pour Supabase
-- Script autonome combinant initialisation, RLS et correctifs
-- ------------------
-- Dernière mise à jour : triggers enregistrant automatiquement
--   updated_at et dernier_prix lors des insertions et mises à jour
--   avec un bloc de migration pour créer ces colonnes et les remplir
--   lors des relances du script
--   Les produits sont automatiquement mis à jour avec le dernier prix
-- Les anciennes tables d'audit, d'alertes, d'import et de 2FA sont
--   désormais renommées pour conserver l'historique lors des mises à jour
-- L'extension pg_cron est forcée dans pg_catalog pour éviter les conflits
-- Les triggers 'trg_mise_a_jour_fournisseur_produits' et 'trg_maj_dernier_prix'
--   sont systématiquement supprimés puis recréés afin de garantir la cohérence
--   Ils se déclenchent sur INSERT et UPDATE pour dater chaque ligne et
--   propager le dernier prix du fournisseur vers le produit correspondant.

-- Le script peut être relancé sur une base vide ou déjà partiellement
-- configurée : chaque étape vérifie l'existence des objets avant de les créer
-- ou de les modifier.
-- Toutes les créations sont conditionnelles pour garantir l'idempotence et permettre une relance en production sans interruption.
-- Les blocs DO conditionnent chaque création ou modification afin d'assurer la reprise après interruption.
-- Les rôles `authenticated`, `anon` et `service_role` sont déjà
-- présents sur Supabase. Aucune création de rôle n'est donc réalisée
-- afin d'éviter des erreurs de privilèges lors de l'exécution du script.

-- L'environnement Supabase fournit déjà le schéma `auth`, la table `users`
-- et la fonction `auth.uid()`
-- Ces objets ne sont donc pas créés ici afin d'éviter les erreurs de droits
-- lors de l'exécution sur Supabase.
-- Assurez-vous donc d'exécuter ce script sur une instance Supabase
-- préconfigurée avec ces rôles et le schéma `auth` existants.

-- Vérification : tous les blocs CREATE TABLE comportent les virgules
-- nécessaires avant les PRIMARY KEY et contraintes

-- Désactiver la vérification des corps de fonctions pour permettre la création
-- avant toutes les tables dépendantes
set check_function_bodies = off;

-- Création du schéma public si nécessaire (jamais supprimé)
create schema if not exists public;
-- Retirer les privilèges génériques
revoke all on schema public from public;
-- Autoriser l'accès aux objets du schéma
grant usage on schema public to authenticated;
grant usage on schema public to anon;
grant all privileges on schema public to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all privileges on tables to service_role;
-- Préparer le schéma des extensions pour Supabase
create schema if not exists extensions;
revoke all on schema extensions from public;
grant usage on schema extensions to authenticated;
grant usage on schema extensions to anon;
grant all privileges on schema extensions to service_role;
-- S'assurer que les fonctions d'extension sont visibles
set search_path = public, extensions;
-- Extensions installées dans le schéma dédié
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
-- pg_cron doit rester dans pg_catalog
create extension if not exists "pg_cron" with schema pg_catalog;
-- S'assurer qu'elle n'est pas dans le schema extensions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_cron'
      AND n.nspname <> 'pg_catalog'
  ) THEN
    ALTER EXTENSION pg_cron SET SCHEMA pg_catalog;
  END IF;
END $$;

-- Fonction utilitaire pour renommer une colonne d'une table ou d'une vue
-- Utilisée dans les blocs DO afin d'éviter les ALTER TABLE/VIEW directs
create or replace function renommer_colonne_public(rel text, old_col text, new_col text)
returns void language plpgsql as $$
declare
  kind char;
begin
  select c.relkind into kind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = rel;

  if kind is null then
    return;
  elsif kind in ('v','m') then
    -- Views and materialized views
    execute format('ALTER VIEW public.%I RENAME COLUMN %I TO %I', rel, old_col, new_col);
  elsif kind in ('r','p') then
    -- Ordinary or partitioned tables
    execute format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', rel, old_col, new_col);
  end if;
exception when others then
  null;
end;
$$;

-- Supprimer la relation users par défaut de Supabase si elle existe (vue ou table)
DO $$
BEGIN
  -- supprimer la vue générée par Supabase
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users' AND c.relkind = 'v'
  ) THEN
    EXECUTE 'DROP VIEW public.users CASCADE';
  END IF;

  -- supprimer la table si elle existe
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users' AND c.relkind IN ('r','p')
  ) THEN
    EXECUTE 'DROP TABLE public.users CASCADE';
  END IF;
END $$;
-- Harmonisation des anciens noms de colonnes
-- Suppression des vues héritées avant renommage pour éviter les conflits
drop view if exists v_product_price_trend;
drop view if exists v_products_last_price;
drop view if exists stock_mouvements;
drop view if exists stocks;
drop view if exists v_cost_center_totals;
-- drop legacy cost center views in the right dependency order
drop view if exists v_cost_center_monthly cascade;
drop view if exists v_cost_center_month;

-- ------------------
-- Tables de base
-- ------------------
create table if not exists mamas (
id uuid primary key default uuid_generate_v4(),
    nom text not null,
    logo text,
  actif boolean default true,
    contact text,
    created_at timestamptz default now()
);

create table if not exists roles (
    id uuid primary key default uuid_generate_v4(),
    nom text not null unique,
    description text,
    actif boolean default true
);

create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    email text not null unique,
    password text,
    role_id uuid references roles(id),
    access_rights jsonb default '[]',
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

create table if not exists utilisateurs (
    id uuid primary key default uuid_generate_v4(),
    auth_id uuid references auth.users(id) on delete cascade,
    email text,
    role text default 'user',
    mama_id uuid references public.mamas(id),
    access_rights jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    actif boolean default true
);

-- S'assurer de la contrainte unique sur auth_id et des index pour des recherches performantes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'utilisateurs_auth_id_key'
  ) THEN
    ALTER TABLE utilisateurs
      ADD CONSTRAINT utilisateurs_auth_id_key UNIQUE (auth_id);
  END IF;
END $$;

DROP INDEX IF EXISTS idx_utilisateurs_auth_id;
CREATE INDEX idx_utilisateurs_auth_id ON utilisateurs(auth_id);
DROP INDEX IF EXISTS idx_utilisateurs_mama_id;
CREATE INDEX idx_utilisateurs_mama_id ON utilisateurs(mama_id);

-- Helper functions used in RLS policies
create or replace function current_user_mama_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select mama_id from utilisateurs where auth_id = auth.uid() limit 1),
    (select mama_id from users where id = auth.uid() limit 1)
  );
$$;
grant execute on function current_user_mama_id() to authenticated;

create or replace function current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from utilisateurs where auth_id = auth.uid() limit 1),
    (select r.nom from users u join roles r on r.id = u.role_id where u.id = auth.uid() limit 1)
  );
$$;
grant execute on function current_user_role() to authenticated;

alter table utilisateurs enable row level security;
alter table utilisateurs force row level security;
drop policy if exists utilisateurs_select on utilisateurs;
create policy utilisateurs_select on utilisateurs
  for select using (
    auth.uid() = auth_id
    or current_user_role() = 'superadmin'
    or (current_user_role() = 'admin' and mama_id = current_user_mama_id())
  );
drop policy if exists utilisateurs_insert on utilisateurs;
create policy utilisateurs_insert on utilisateurs
  for insert with check (
    auth.uid() = auth_id
    or current_user_role() = 'superadmin'
    or (current_user_role() = 'admin' and mama_id = current_user_mama_id())
  );
drop policy if exists utilisateurs_update on utilisateurs;
create policy utilisateurs_update on utilisateurs
  for update using (
    auth.uid() = auth_id
    or current_user_role() = 'superadmin'
    or (current_user_role() = 'admin' and mama_id = current_user_mama_id())
  ) with check (
    auth.uid() = auth_id
    or current_user_role() = 'superadmin'
    or (current_user_role() = 'admin' and mama_id = current_user_mama_id())
  );
drop policy if exists utilisateurs_delete on utilisateurs;
create policy utilisateurs_delete on utilisateurs
  for delete using (
    auth.uid() = auth_id
    or current_user_role() = 'superadmin'
    or (current_user_role() = 'admin' and mama_id = current_user_mama_id())
  );
grant select, insert, update, delete on utilisateurs to authenticated;


-- Familles / Unités
create table if not exists familles (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom)
);

create table if not exists unites (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    abbr text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom)
);

-- Fournisseurs
create table if not exists fournisseurs (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    ville text,
    tel text,
    contact text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom)
);

-- Produits
create table if not exists produits (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    famille_id uuid references familles(id) on delete set null,
    unite_id uuid references unites(id) on delete set null,
    famille text,
    unite text,
    pmp numeric default 0,
    stock_theorique numeric default 0,
    stock_reel numeric default 0,
    stock_min numeric default 0,
    code text,
    allergenes text,
    image text,
    dernier_prix numeric,
    fournisseur_principal_id uuid references fournisseurs(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom, unite)
);

-- Historique des prix fournisseurs
create table if not exists fournisseur_produits (
    id uuid primary key default uuid_generate_v4(),
    produit_id uuid references produits(id) on delete cascade,
    fournisseur_id uuid references fournisseurs(id) on delete cascade,
    prix_achat numeric not null,
    date_livraison date default current_date,
    mama_id uuid not null references mamas(id),
    updated_at timestamptz default now(),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(produit_id, fournisseur_id, date_livraison)
);

create or replace function maj_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_mise_a_jour_fournisseur_produits on fournisseur_produits;
create trigger trg_mise_a_jour_fournisseur_produits
  before insert or update on fournisseur_produits
  for each row execute function maj_updated_at();

-- Maintenir le dernier prix connu dans la table produits
create or replace function maj_dernier_prix_produit()
returns trigger language plpgsql as $$
begin
  -- mettre à jour le produit correspondant dans la même mama
  update produits
     set dernier_prix = new.prix_achat,
         fournisseur_principal_id = coalesce(fournisseur_principal_id, new.fournisseur_id)
   where id = new.produit_id
     and mama_id = new.mama_id;
  return new;
end;
$$;

drop trigger if exists trg_maj_dernier_prix on fournisseur_produits;
create trigger trg_maj_dernier_prix
  after insert or update on fournisseur_produits
  for each row execute function maj_dernier_prix_produit();

-- Factures
create table if not exists factures (
    id uuid primary key default uuid_generate_v4(),
    reference text,
    date_facture date not null,
    fournisseur_id uuid references fournisseurs(id) on delete set null,
    montant numeric,
    total_ht numeric default 0,
    total_tva numeric default 0,
    total_ttc numeric default 0,
    statut text,
    justificatif text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);

create table if not exists facture_lignes (
    id uuid primary key default uuid_generate_v4(),
    facture_id uuid references factures(id) on delete cascade,
    produit_id uuid references produits(id) on delete set null,
    quantite numeric not null,
    prix_unitaire numeric not null,
    tva numeric default 0,
    total numeric generated always as (quantite * prix_unitaire) stored,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);

-- Fiches techniques
create table if not exists fiches (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    famille_id uuid references familles(id) on delete set null,
    rendement numeric,
    portions integer,
    cout_total numeric,
    cout_par_portion numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom)
);

create table if not exists fiche_lignes (
    id uuid primary key default uuid_generate_v4(),
    fiche_id uuid references fiches(id) on delete cascade,
    produit_id uuid references produits(id) on delete set null,
    quantite numeric not null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);

create table if not exists fiche_cout_history (
    id uuid primary key default uuid_generate_v4(),
    fiche_id uuid references fiches(id) on delete cascade,
    date_cout date default current_date,
    cout_total numeric,
    cout_par_portion numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);

-- Fiches techniques avancees
create table if not exists fiches_techniques (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    famille text,
    portions integer,
    cout_total numeric,
    cout_portion numeric,
    carte_actuelle boolean default false,
    type_carte text,
    sous_type_carte text,
    prix_vente numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom)
);
-- Inventaires et mouvements
create table if not exists inventaires (
    id uuid primary key default uuid_generate_v4(),
    date_inventaire date not null,
    reference text,
    cloture boolean default false,
    zone text,
    date_debut date,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);

create table if not exists inventaire_lignes (
    id uuid primary key default uuid_generate_v4(),
    inventaire_id uuid references inventaires(id) on delete cascade,
    produit_id uuid references produits(id) on delete set null,
    quantite numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);

-- Zones de stock
create table if not exists zones_stock (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom)
);

-- Inventaire zones
create table if not exists inventaire_zones (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom)
);

create table if not exists mouvements_stock (
    id uuid primary key default uuid_generate_v4(),
    produit_id uuid references produits(id) on delete set null,
    quantite numeric not null,
    type text check (type in ('entree','sortie','correction','transfert')),
    zone_source_id uuid references zones_stock(id),
    zone_destination_id uuid references zones_stock(id),
    sous_type text,
    zone text,
    motif text,
    date_mouvement date default current_date,
    commentaire text,
    auteur_id uuid references utilisateurs(id),
    inventaire_id uuid references inventaires(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);


-- Contacts et notes fournisseurs
create table if not exists fournisseur_contacts (
    id uuid primary key default uuid_generate_v4(),
    fournisseur_id uuid references fournisseurs(id) on delete cascade,
    nom text,
    email text,
    tel text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

create table if not exists fournisseur_notes (
    id uuid primary key default uuid_generate_v4(),
    fournisseur_id uuid references fournisseurs(id) on delete cascade,
    note text,
    "date" date default current_date,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Permissions
create table if not exists permissions (
    id uuid primary key default uuid_generate_v4(),
    role_id uuid references roles(id) on delete cascade,
    user_id uuid references users(id) on delete cascade,
    module text not null,
    droit text not null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Menus
create table if not exists menus (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    "date" date,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(mama_id, nom, "date")
);

create table if not exists menu_fiches (
    id uuid primary key default uuid_generate_v4(),
    menu_id uuid references menus(id) on delete cascade,
    fiche_id uuid references fiches(id) on delete cascade,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique(menu_id, fiche_id)
);

-- Réquisitions
create table if not exists requisitions (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id),
    produit_id uuid references produits(id),
    zone_id uuid references zones_stock(id),
    date_requisition date default current_date,
    quantite numeric not null,
    type text,
    commentaire text,
    auteur_id uuid references utilisateurs(id),
    created_at timestamptz default now(),
    actif boolean default true
);

-- Transferts de stock
create table if not exists transferts (
    id uuid primary key default uuid_generate_v4(),
    produit_id uuid references produits(id) on delete set null,
    quantite numeric,
    zone_depart text,
    zone_arrivee text,
    motif text,
    date_transfert date default current_date,
    created_by uuid references users(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);


-- Ventes de boissons
create table if not exists ventes_boissons (
    id uuid primary key default uuid_generate_v4(),
    boisson_id uuid references fiches(id) on delete set null,
    quantite numeric,
    date_vente date default current_date,
    created_by uuid references users(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);

-- Parametres generaux
create table if not exists parametres (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null unique references mamas(id),
    nom text,
    logo text,
    contacts jsonb,
    created_at timestamptz default now()
);

DROP INDEX IF EXISTS idx_requisitions_date;
CREATE INDEX idx_requisitions_date ON requisitions(date_requisition);
DROP INDEX IF EXISTS idx_transferts_mama;
CREATE INDEX idx_transferts_mama ON transferts(mama_id);
DROP INDEX IF EXISTS idx_transferts_produit;
CREATE INDEX idx_transferts_produit ON transferts(produit_id);
CREATE INDEX IF NOT EXISTS idx_transferts_actif ON transferts(actif);
DROP INDEX IF EXISTS idx_zones_stock_mama;
CREATE INDEX idx_zones_stock_mama ON zones_stock(mama_id);
CREATE INDEX IF NOT EXISTS idx_zones_stock_actif ON zones_stock(actif);
-- Index pour accélérer la recherche par zone dans les mouvements de stock
DROP INDEX IF EXISTS idx_mouvements_stock_zone_source;
CREATE INDEX idx_mouvements_stock_zone_source ON mouvements_stock(zone_source_id);
DROP INDEX IF EXISTS idx_mouvements_stock_zone_destination;
CREATE INDEX idx_mouvements_stock_zone_destination ON mouvements_stock(zone_destination_id);
DROP INDEX IF EXISTS idx_inventaire_zones_mama;
CREATE INDEX idx_inventaire_zones_mama ON inventaire_zones(mama_id);
DROP INDEX IF EXISTS idx_ventes_boissons_mama;
CREATE INDEX idx_ventes_boissons_mama ON ventes_boissons(mama_id);
DROP INDEX IF EXISTS idx_ventes_boissons_boisson;
CREATE INDEX idx_ventes_boissons_boisson ON ventes_boissons(boisson_id);
CREATE INDEX IF NOT EXISTS idx_ventes_boissons_actif ON ventes_boissons(actif);
create or replace view stock_mouvements as select * from mouvements_stock;
grant select on stock_mouvements to authenticated;
create or replace view stocks as
select
  m.*,
  m.actif as mouvements_stock_actif
from mouvements_stock m;
create or replace function mettre_a_jour_pmp_produit()
returns trigger language plpgsql as $$
begin
  update produits
    set pmp = ((coalesce(pmp,0) * stock_reel) + (new.quantite * new.prix_unitaire)) / nullif(stock_reel + new.quantite,0),
        stock_reel = stock_reel + new.quantite
  where id = new.produit_id;
  return new;
end;
$$;

drop trigger if exists trg_ligne_facture on facture_lignes;
drop trigger if exists trg_facture_ligne on facture_lignes;
create trigger trg_ligne_facture after insert on facture_lignes
  for each row execute function mettre_a_jour_pmp_produit();

-- Maintien du dernier prix d'achat enregistré
create or replace function mettre_a_jour_prix_produit()
returns trigger language plpgsql as $$
declare
  supp uuid;
  d date;
begin
  if new.facture_id is null then
    return new;
  end if;
  select fournisseur_id, date_facture into supp, d from factures where id = new.facture_id;
  if supp is null then
    return new;
  end if;
  insert into fournisseur_produits(produit_id, fournisseur_id, prix_achat, date_livraison, mama_id)
    values (new.produit_id, supp, new.prix_unitaire, d, new.mama_id)
    on conflict (produit_id, fournisseur_id, date_livraison)
    do update set prix_achat = excluded.prix_achat, updated_at = now();
  -- La mise à jour du dernier prix du produit est assurée par un trigger
  -- sur la table fournisseur_produits
  return new;
end;
$$;

drop trigger if exists trg_maj_prix_produit on facture_lignes;
drop trigger if exists trg_update_prix_produit on facture_lignes;
create trigger trg_maj_prix_produit
  after insert on facture_lignes
  for each row execute function mettre_a_jour_prix_produit();

-- Mise à jour du PMP lors de la modification d'un achat
create or replace function maj_pmp_produit_update()
returns trigger language plpgsql as $$
begin
  update produits
     set stock_reel = stock_reel - old.quantite + new.quantite,
         pmp = (
           (coalesce(pmp,0) * stock_reel)
           - coalesce(old.quantite,0) * coalesce(old.prix_unitaire,0)
           + new.quantite * new.prix_unitaire
         ) / nullif(stock_reel - old.quantite + new.quantite, 0)
   where id = new.produit_id;
  return new;
end;
$$;

drop trigger if exists trg_maj_pmp_achat on facture_lignes;
create trigger trg_maj_pmp_achat
  after update on facture_lignes
  for each row execute function maj_pmp_produit_update();

-- Trigger pour maintenir le total de la facture en phase avec ses lignes
create or replace function rafraichir_total_facture()
returns trigger language plpgsql as $$
declare
  fid uuid := coalesce(new.facture_id, old.facture_id);
  ht numeric;
  tv numeric;
begin
  select sum(quantite * prix_unitaire),
         sum(quantite * prix_unitaire * (coalesce(tva,0)/100))
    into ht, tv
    from facture_lignes
   where facture_id = fid;
  update factures f
     set montant   = coalesce(ht,0) + coalesce(tv,0),
         total_ht  = coalesce(ht,0),
         total_tva = coalesce(tv,0),
         total_ttc = coalesce(ht,0) + coalesce(tv,0)
   where f.id = fid;
  return new;
end;
$$;

drop trigger if exists trg_total_facture on facture_lignes;
drop trigger if exists trg_facture_total on facture_lignes;
create trigger trg_total_facture
  after insert or update or delete on facture_lignes
  for each row execute function rafraichir_total_facture();

-- Trigger de mise à jour du stock théorique lors de l'enregistrement des mouvements
create or replace function maj_stock_produit()
returns trigger language plpgsql as $$
begin
  if new.type = 'entree' or new.type = 'correction' or new.type = 'transfert' then
    update produits set stock_theorique = stock_theorique + new.quantite where id = new.produit_id;
  elsif new.type = 'sortie' then
    update produits set stock_theorique = stock_theorique - new.quantite where id = new.produit_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_mouvement_stock on mouvements_stock;
drop trigger if exists trg_maj_stock on mouvements_stock;
create trigger trg_maj_stock after insert on mouvements_stock
  for each row execute function maj_stock_produit();

-- Mise à jour du stock réel depuis l'inventaire
create or replace function maj_stock_reel()
returns trigger language plpgsql as $$
begin
  update produits set stock_reel = new.quantite where id = new.produit_id;
  return new;
end;
$$;

drop trigger if exists trg_ligne_inventaire on inventaire_lignes;
drop trigger if exists trg_maj_stock_reel on inventaire_lignes;
create trigger trg_maj_stock_reel after insert on inventaire_lignes
  for each row execute function maj_stock_reel();

-- Trigger de rafraîchissement du coût des fiches lors des modifications
create or replace function rafraichir_cout_fiche()
returns trigger language plpgsql as $$
declare
  fid uuid := coalesce(new.fiche_id, new.id, old.fiche_id, old.id);
  total numeric;
  portions integer;
  mid uuid;
begin
  select sum(fl.quantite * coalesce(p.pmp,0)), f.portions, f.mama_id
    into total, portions, mid
    from fiches f
      left join fiche_lignes fl on fl.fiche_id = f.id
      left join produits p on fl.produit_id = p.id
    where f.id = fid
    group by f.portions, f.mama_id;

  update fiches set
    cout_total = coalesce(total,0),
    cout_par_portion = coalesce(total,0)/nullif(portions,0)
  where id = fid;

  insert into fiche_cout_history (fiche_id, date_cout, cout_total, cout_par_portion, mama_id)
  values (fid, current_date, coalesce(total,0), coalesce(total,0)/nullif(portions,0), mid);

  return new;
end;
$$;

drop trigger if exists trg_cout_ligne_fiche on fiche_lignes;
drop trigger if exists trg_fiche_lignes_cost on fiche_lignes;
create trigger trg_cout_ligne_fiche
  after insert or update or delete on fiche_lignes
  for each row execute function rafraichir_cout_fiche();

drop trigger if exists trg_cout_fiche on fiches;
drop trigger if exists trg_fiche_update_cost on fiches;
create trigger trg_cout_fiche
  after update on fiches
  for each row execute function rafraichir_cout_fiche();

-- Statistiques : total des achats par mois pour tous les fournisseurs
create or replace function stats_achats_fournisseurs(mama_id_param uuid)
returns table(mois text, total_achats numeric)
language sql as $$
  select to_char(f.date_facture, 'YYYY-MM') as mois,
         sum(fl.total) as total_achats
  from factures f
    join facture_lignes fl on fl.facture_id = f.id
  where f.mama_id = mama_id_param
  group by 1
  order by 1;
$$;
grant execute on function stats_achats_fournisseurs(uuid) to authenticated;

-- Statistiques : total des achats par mois pour un fournisseur
create or replace function stats_achats_fournisseur(mama_id_param uuid, fournisseur_id_param uuid)
returns table(mois text, total_achats numeric)
language sql as $$
  select to_char(f.date_facture, 'YYYY-MM') as mois,
         sum(fl.total) as total_achats
  from factures f
    join facture_lignes fl on fl.facture_id = f.id
  where f.mama_id = mama_id_param
    and f.fournisseur_id = fournisseur_id_param
  group by 1
  order by 1;
$$;
grant execute on function stats_achats_fournisseur(uuid, uuid) to authenticated;
--
-- Assure la compatibilité lors d'une réexécution du script en supprimant
-- l'ancienne version utilisant le paramètre product_id_param si elle existe
-- Supprime toute version existante de la fonction pour garantir
-- la compatibilité avec les anciennes signatures (ex. product_id_param)
drop function if exists stats_rotation_produit(uuid, uuid) cascade;
-- Statistiques : rotation du produit par mois
create or replace function stats_rotation_produit(mama_id_param uuid, produit_id_param uuid)
returns table(mois text, quantite_sortie numeric)
language sql as $$
  select to_char(date_mouvement, 'YYYY-MM') as mois,
         sum(quantite) as quantite_sortie
  from mouvements_stock
  where mama_id = mama_id_param
    and produit_id = produit_id_param
    and type = 'sortie'
  group by 1
  order by 1;
$$;
-- Politiques RLS pour MamaStock
grant execute on function stats_rotation_produit(uuid, uuid) to authenticated;

-- Helper function current_user_mama_id() defined above

-- Table des utilisateurs
alter table if exists users enable row level security;
alter table if exists users force row level security;
drop policy if exists users_select on users;
create policy users_select on users for select using (id = auth.uid());
drop policy if exists users_mod on users;
create policy users_mod on users for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists users_insert on users;
create policy users_insert on users for insert with check (
  id = auth.uid() and mama_id = current_user_mama_id()
);

-- Table des rôles (lecture seule pour l'instant)
alter table roles enable row level security;
alter table roles force row level security;
drop policy if exists roles_select on roles;
create policy roles_select on roles for select using (true);

-- Tables filtered by mama_id
alter table mamas enable row level security;
alter table mamas force row level security;
drop policy if exists mamas_all on mamas;
create policy mamas_all on mamas for all
  using (id = current_user_mama_id())
  with check (id = current_user_mama_id());

alter table fournisseurs enable row level security;
alter table fournisseurs force row level security;
drop policy if exists fournisseurs_all on fournisseurs;
create policy fournisseurs_all on fournisseurs for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table produits enable row level security;
alter table produits force row level security;
drop policy if exists produits_all on produits;
create policy produits_all on produits for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fournisseur_produits enable row level security;
alter table fournisseur_produits force row level security;
drop policy if exists fournisseur_produits_all on fournisseur_produits;
create policy fournisseur_produits_all on fournisseur_produits for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table factures enable row level security;
alter table factures force row level security;
drop policy if exists factures_all on factures;
create policy factures_all on factures for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table facture_lignes enable row level security;
alter table facture_lignes force row level security;
drop policy if exists facture_lignes_all on facture_lignes;
create policy facture_lignes_all on facture_lignes for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fiches enable row level security;
alter table fiches force row level security;
drop policy if exists fiches_all on fiches;
create policy fiches_all on fiches for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fiche_lignes enable row level security;
alter table fiche_lignes force row level security;
drop policy if exists fiche_lignes_all on fiche_lignes;
create policy fiche_lignes_all on fiche_lignes for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fiche_cout_history enable row level security;
alter table fiche_cout_history force row level security;
drop policy if exists fiche_cout_history_all on fiche_cout_history;
create policy fiche_cout_history_all on fiche_cout_history for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table inventaires enable row level security;
alter table inventaires force row level security;
drop policy if exists inventaires_all on inventaires;
create policy inventaires_all on inventaires for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table inventaire_lignes enable row level security;
alter table inventaire_lignes force row level security;
drop policy if exists inventaire_lignes_all on inventaire_lignes;
create policy inventaire_lignes_all on inventaire_lignes for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table mouvements_stock enable row level security;
alter table mouvements_stock force row level security;
drop policy if exists mouvements_stock_select on mouvements_stock;
drop policy if exists mouvements_stock_insert on mouvements_stock;
drop policy if exists mouvements_stock_update on mouvements_stock;
drop policy if exists mouvements_stock_delete on mouvements_stock;
create policy mouvements_stock_select on mouvements_stock for select using (
  mama_id = current_user_mama_id()
);
create policy mouvements_stock_insert on mouvements_stock for insert with check (
  mama_id = current_user_mama_id() and auteur_id = auth.uid()
);
create policy mouvements_stock_update on mouvements_stock for update using (
  mama_id = current_user_mama_id() and auteur_id = auth.uid() and created_at >= now() - interval '24 hours'
) with check (
  mama_id = current_user_mama_id() and auteur_id = auth.uid()
);
create policy mouvements_stock_delete on mouvements_stock for delete using (
  mama_id = current_user_mama_id() and auteur_id = auth.uid() and created_at >= now() - interval '24 hours'
);

alter table familles enable row level security;
alter table familles force row level security;
drop policy if exists familles_all on familles;
create policy familles_all on familles for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table unites enable row level security;
alter table unites force row level security;
drop policy if exists unites_all on unites;
create policy unites_all on unites for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table parametres enable row level security;
alter table parametres force row level security;
drop policy if exists parametres_all on parametres;
create policy parametres_all on parametres for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fournisseur_contacts enable row level security;
alter table fournisseur_contacts force row level security;
drop policy if exists fournisseur_contacts_all on fournisseur_contacts;
create policy fournisseur_contacts_all on fournisseur_contacts for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table fournisseur_notes enable row level security;
alter table fournisseur_notes force row level security;
drop policy if exists fournisseur_notes_all on fournisseur_notes;
create policy fournisseur_notes_all on fournisseur_notes for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table permissions enable row level security;
alter table permissions force row level security;
drop policy if exists permissions_all on permissions;
create policy permissions_all on permissions for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table menus enable row level security;
alter table menus force row level security;
drop policy if exists menus_all on menus;
create policy menus_all on menus for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table menu_fiches enable row level security;
alter table menu_fiches force row level security;
drop policy if exists menu_fiches_all on menu_fiches;
create policy menu_fiches_all on menu_fiches for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table requisitions enable row level security;
alter table requisitions force row level security;
drop policy if exists requisitions_all on requisitions;
drop policy if exists requisitions_insert on requisitions;
drop policy if exists requisitions_update on requisitions;
drop policy if exists requisitions_delete on requisitions;
create policy requisitions_all on requisitions for select using (
  mama_id = current_user_mama_id()
);
create policy requisitions_insert on requisitions for insert with check (
  mama_id = current_user_mama_id() and auteur_id = auth.uid()
);
create policy requisitions_update on requisitions for update using (
  mama_id = current_user_mama_id() and auteur_id = auth.uid() and created_at > now() - interval '24 hours'
) with check (
  mama_id = current_user_mama_id() and auteur_id = auth.uid()
);
create policy requisitions_delete on requisitions for delete using (
  mama_id = current_user_mama_id() and auteur_id = auth.uid() and created_at > now() - interval '24 hours'
);


alter table transferts enable row level security;
alter table transferts force row level security;
drop policy if exists transferts_all on transferts;
create policy transferts_all on transferts for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table zones_stock enable row level security;
alter table zones_stock force row level security;
drop policy if exists zones_stock_all on zones_stock;
create policy zones_stock_all on zones_stock for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table inventaire_zones enable row level security;
alter table inventaire_zones force row level security;
drop policy if exists inventaire_zones_all on inventaire_zones;
create policy inventaire_zones_all on inventaire_zones for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

alter table ventes_boissons enable row level security;
alter table ventes_boissons force row level security;
drop policy if exists ventes_boissons_all on ventes_boissons;
create policy ventes_boissons_all on ventes_boissons for all using (mama_id = current_user_mama_id()) with check (mama_id = current_user_mama_id());

-- Droits d'accès
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
-- Tables supplémentaires pour la gestion analytique des centres de coût (issue du patch mama_stock)

-- Table des centres de coût par mama
create table if not exists centres_de_cout (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    nom text not null,
    created_at timestamptz default now(),
    actif boolean default true,
    unique (mama_id, nom)
);

-- Table de liaison des mouvements de stock aux centres de coût (ventilation)
create table if not exists mouvements_centres_cout (
    id uuid primary key default uuid_generate_v4(),
    mouvement_id uuid references mouvements_stock(id) on delete cascade,
    centre_cout_id uuid references centres_de_cout(id) on delete cascade,
    quantite numeric,
    valeur numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true
);

-- Index pour des requêtes plus rapides
DROP INDEX IF EXISTS idx_centres_de_cout_mama;
CREATE INDEX idx_centres_de_cout_mama ON centres_de_cout(mama_id);
DROP INDEX IF EXISTS idx_centres_de_cout_nom;
CREATE INDEX idx_centres_de_cout_nom ON centres_de_cout(nom);
DROP INDEX IF EXISTS idx_mouvements_cc_mama;
CREATE INDEX idx_mouvements_cc_mama ON mouvements_centres_cout(mama_id);
DROP INDEX IF EXISTS idx_mouvements_cc_mouvement;
CREATE INDEX idx_mouvements_cc_mouvement ON mouvements_centres_cout(mouvement_id);
DROP INDEX IF EXISTS idx_mouvements_cc_centre;
CREATE INDEX idx_mouvements_cc_centre ON mouvements_centres_cout(centre_cout_id);

-- Politiques de sécurité au niveau des lignes
alter table centres_de_cout enable row level security;
alter table centres_de_cout force row level security;
drop policy if exists centres_de_cout_all on centres_de_cout;
create policy centres_de_cout_all on centres_de_cout
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on centres_de_cout to authenticated;

alter table mouvements_centres_cout enable row level security;
alter table mouvements_centres_cout force row level security;
drop policy if exists mouvements_centres_cout_all on mouvements_centres_cout;
create policy mouvements_centres_cout_all on mouvements_centres_cout
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on mouvements_centres_cout to authenticated;

-- Centres de coût par défaut optionnels
insert into centres_de_cout (id, mama_id, nom)
select '00000000-0000-0000-0000-000000009001', id, 'Food'
from mamas where not exists (
  select 1 from centres_de_cout where mama_id = mamas.id and nom = 'Food'
);
insert into centres_de_cout (id, mama_id, nom)
select '00000000-0000-0000-0000-000000009002', id, 'Beverage'
from mamas where not exists (
  select 1 from centres_de_cout where mama_id = mamas.id and nom = 'Beverage'
);

-- Table for audit logs
create table if not exists journaux_utilisateur (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    user_id uuid references users(id) on delete set null,
    action text not null,
    details jsonb,
    done_by uuid references users(id) on delete set null,
    created_at timestamptz default now(),
    actif boolean default true
);

DROP INDEX IF EXISTS idx_journaux_utilisateur_mama;
CREATE INDEX idx_journaux_utilisateur_mama ON journaux_utilisateur(mama_id);
DROP INDEX IF EXISTS idx_journaux_utilisateur_user;
CREATE INDEX idx_journaux_utilisateur_user ON journaux_utilisateur(user_id);
DROP INDEX IF EXISTS idx_journaux_utilisateur_done;
CREATE INDEX idx_journaux_utilisateur_done ON journaux_utilisateur(done_by);
DROP INDEX IF EXISTS idx_journaux_utilisateur_date;
CREATE INDEX idx_journaux_utilisateur_date ON journaux_utilisateur(created_at);

alter table journaux_utilisateur enable row level security;
alter table journaux_utilisateur force row level security;
drop policy if exists journaux_utilisateur_all on journaux_utilisateur;
create policy journaux_utilisateur_all on journaux_utilisateur
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on journaux_utilisateur to authenticated;

-- Vue récapitulative de la consommation par centre de coût
create or replace view v_totaux_centres_cout as
select
  c.mama_id,
  c.id as centre_cout_id,
  c.nom,
  c.actif as centre_cout_actif,
  bool_or(m.actif) as mouvements_cc_actifs,
  coalesce(sum(m.quantite),0) as quantite_totale,
  coalesce(sum(m.valeur),0) as valeur_totale
from centres_de_cout c
left join mouvements_centres_cout m on m.centre_cout_id = c.id
group by c.mama_id, c.id, c.nom;
grant select on v_totaux_centres_cout to authenticated;

-- Vue mensuelle de la consommation par centre de coût
create or replace view v_centres_cout_mensuel as
select
  c.mama_id,
  c.id as centre_cout_id,
  date_trunc('month', m.created_at) as mois,
  c.nom,
  c.actif as centre_cout_actif,
  bool_or(m.actif) as mouvements_cc_actifs,
  coalesce(sum(m.quantite),0) as quantite,
  coalesce(sum(m.valeur),0) as valeur
from centres_de_cout c
left join mouvements_centres_cout m on m.centre_cout_id = c.id
group by c.mama_id, c.id, mois, c.nom;
grant select on v_centres_cout_mensuel to authenticated;

-- Vue alias pour les totaux mensuels par centre de coût
create or replace view v_centres_cout_mois as
select * from v_centres_cout_mensuel;
grant select on v_centres_cout_mois to authenticated;

-- Fonction retournant les statistiques par centre de coût pour une période donnée
create or replace function stats_centres_de_cout(mama_id_param uuid, debut_param date default null, fin_param date default null)
returns table(centre_cout_id uuid, nom text, quantite numeric, valeur numeric)
language plpgsql security definer
set search_path = public as $$
begin
  return query
    select c.id, c.nom, sum(coalesce(m.quantite,0)), sum(coalesce(m.valeur,0))
    from centres_de_cout c
    left join mouvements_centres_cout m on m.centre_cout_id = c.id
      and (debut_param is null or m.created_at >= debut_param)
      and (fin_param is null or m.created_at < fin_param + interval '1 day')
    where c.mama_id = mama_id_param
    group by c.id, c.nom;
end;
$$;
grant execute on function stats_centres_de_cout(uuid, date, date) to authenticated;

-- Fonction déclenchée pour journaliser les changements de centre de coût
create or replace function journaliser_modifs_centres_cout()
returns trigger language plpgsql as $$
begin
  insert into journaux_utilisateur(mama_id, user_id, action, details, done_by)
  values(
    coalesce(new.mama_id, old.mama_id),
    auth.uid(),
    'centres_de_cout ' || tg_op,
    jsonb_build_object('id_old', old.id, 'id_new', new.id, 'nom_old', old.nom, 'nom_new', new.nom),
    auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists trg_journal_centres_cout on centres_de_cout;
drop trigger if exists trg_log_centres_de_cout on centres_de_cout;
create trigger trg_journal_centres_cout
  after insert or update or delete on centres_de_cout
  for each row execute function journaliser_modifs_centres_cout();
grant execute on function journaliser_modifs_centres_cout() to authenticated;

-- Fonction déclenchée pour journaliser l'affectation des mouvements aux centres de coût
create or replace function journaliser_modifs_mouvement_cc()
returns trigger language plpgsql as $$
begin
  insert into journaux_utilisateur(mama_id, user_id, action, details, done_by)
  values(
    coalesce(new.mama_id, old.mama_id),
    auth.uid(),
    'mouvements_centres_cout ' || tg_op,
    jsonb_build_object('mouvement_id', coalesce(new.mouvement_id, old.mouvement_id)),
    auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists trg_journal_mouvement_cc on mouvements_centres_cout;
drop trigger if exists trg_log_mouvement_cc on mouvements_centres_cout;
create trigger trg_journal_mouvement_cc
  after insert or update or delete on mouvements_centres_cout
  for each row execute function journaliser_modifs_mouvement_cc();
grant execute on function journaliser_modifs_mouvement_cc() to authenticated;

-- Vue détaillée des affectations de mouvements de stock
create or replace view v_ventilation as
select
  mc.mama_id,
  mc.mouvement_id,
  m.date_mouvement,
  m.produit_id,
  mc.centre_cout_id,
  cc.nom as centre_cout,
  mc.actif as mouvement_centre_cout_actif,
  m.actif as mouvement_actif,
  cc.actif as centre_cout_actif,
  mc.quantite,
  mc.valeur
from mouvements_centres_cout mc
join mouvements_stock m on m.id = mc.mouvement_id
join centres_de_cout cc on cc.id = mc.centre_cout_id;
grant select on v_ventilation to authenticated;

-- Vue des fournisseurs sans facture depuis 6 mois
create or replace view v_fournisseurs_inactifs as
select
  f.mama_id,
  f.id as fournisseur_id,
  f.nom,
  f.actif as fournisseur_actif,
  bool_or(fc.actif) as facture_actif,
  max(fc.date_facture) as last_invoice_date,
  date_part('month', age(current_date, max(fc.date_facture))) as months_since_last_invoice
  from fournisseurs f
left join factures fc on fc.fournisseur_id = f.id
where f.mama_id is not null
  group by f.mama_id, f.id, f.nom
  having coalesce(max(fc.date_facture), current_date - interval '999 months') < current_date - interval '6 months';
grant select on v_fournisseurs_inactifs to authenticated;

-- Table des pertes produits
create table if not exists pertes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    produit_id uuid not null references produits(id) on delete cascade,
    centre_cout_id uuid references centres_de_cout(id),
    date_perte date not null default current_date,
    quantite numeric not null,
    motif text,
    created_at timestamptz default now(),
    actif boolean default true,
    created_by uuid references users(id)
);
DROP INDEX IF EXISTS idx_pertes_mama;
CREATE INDEX idx_pertes_mama ON pertes(mama_id);
DROP INDEX IF EXISTS idx_pertes_produit;
CREATE INDEX idx_pertes_produit ON pertes(produit_id);

-- RLS pour la table pertes
alter table pertes enable row level security;
alter table pertes force row level security;
drop policy if exists pertes_all on pertes;
create policy pertes_all on pertes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on pertes to authenticated;


-- Trigger de journalisation des pertes
create or replace function journaliser_modifs_pertes()
returns trigger language plpgsql as $$
begin
  insert into journaux_utilisateur(mama_id, user_id, action, details, done_by)
  values(new.mama_id, auth.uid(), 'pertes ' || tg_op,
         jsonb_build_object('id', new.id, 'produit_id', new.produit_id),
         auth.uid());
  return new;
end;
$$;
grant execute on function journaliser_modifs_pertes() to authenticated;
drop trigger if exists trg_journal_pertes on pertes;
drop trigger if exists trg_log_pertes on pertes;
create trigger trg_journal_pertes
  after insert or update or delete on pertes
  for each row execute function journaliser_modifs_pertes();


-- Fonction suggérant les allocations de centre de coût selon l'historique
create or replace function suggest_centres_de_cout(p_produit_id uuid)
returns table(centre_cout_id uuid, nom text, ratio numeric)
language sql stable security definer
set search_path = public as $$
  select
    mcc.centre_cout_id,
    cc.nom,
    sum(mcc.quantite)::numeric / greatest(sum(sum_mcc.quantite),1) as ratio
  from mouvements_centres_cout mcc
  join mouvements_stock ms on ms.id = mcc.mouvement_id
  join centres_de_cout cc on cc.id = mcc.centre_cout_id
  join (
    select sum(abs(m.quantite)) as quantite
    from mouvements_stock m
    where m.produit_id = p_produit_id
      and m.mama_id = current_user_mama_id()
      and m.quantite < 0
  ) sum_mcc on true
  where ms.produit_id = p_produit_id
    and ms.mama_id = current_user_mama_id()
    and ms.quantite < 0
  group by mcc.centre_cout_id, cc.nom;
$$;
grant execute on function suggest_centres_de_cout(uuid) to authenticated;

-- Vue du prix moyen d'achat mensuel par produit
create or replace view v_tendance_prix_produit as
select
  fl.mama_id,
  fl.produit_id,
  date_trunc('month', f.date_facture) as mois,
  bool_or(fl.actif) as facture_ligne_actif,
  bool_or(f.actif) as facture_actif,
  avg(fl.prix_unitaire) as prix_moyen
from facture_lignes fl
  join factures f on f.id = fl.facture_id
  group by fl.mama_id, fl.produit_id, mois;
grant select on v_tendance_prix_produit to authenticated;

-- PMP moyen pondere
create or replace view v_pmp as
select
  p.mama_id,
  p.id as produit_id,
  p.actif as produit_actif,
  bool_or(sp.actif) as fournisseur_produit_actif,
  coalesce(avg(sp.prix_achat),0) as pmp
from produits p
left join fournisseur_produits sp on sp.produit_id = p.id and sp.mama_id = p.mama_id
group by p.mama_id, p.id, p.actif;
grant select on v_pmp to authenticated;

-- Variation de prix fournisseurs
create or replace view v_reco_surcout as
select
  sp.mama_id,
  sp.fournisseur_id,
  sp.produit_id,
  bool_or(sp.actif) as fournisseur_produit_actif,
  max(sp.prix_achat) - min(sp.prix_achat) as variation
from fournisseur_produits sp
group by sp.mama_id, sp.fournisseur_id, sp.produit_id;
grant select on v_reco_surcout to authenticated;

-- Nombre d'achats par fournisseur
create or replace view v_fournisseur_stats as
select
  f.mama_id,
  f.id as fournisseur_id,
  f.nom,
  f.actif as fournisseur_actif,
  bool_or(fc.actif) as facture_actif,
  count(fc.id) as nb_factures
from fournisseurs f
left join factures fc on fc.fournisseur_id = f.id
group by f.mama_id, f.id, f.nom, f.actif;
grant select on v_fournisseur_stats to authenticated;

-- Vue des produits avec leur dernier prix fournisseur
create or replace view v_produits_dernier_prix as
select
  p.id,
  p.nom,
  f.nom as famille,
  u.nom as unite,
  f.actif as famille_actif,
  u.actif as unite_actif,
  p.famille_id,
  p.unite_id,
  p.pmp,
  p.stock_theorique,
  p.stock_reel,
  p.stock_min,
  p.actif,
  p.code,
  p.allergenes,
  p.image,
  p.fournisseur_principal_id,
  p.mama_id,
  p.created_at,
  p.dernier_prix,
  sp.date_livraison as dernier_prix_date,
  sp.fournisseur_id as dernier_fournisseur_id,
  sp.actif as fournisseur_produit_actif
  from produits p
left join familles f on f.id = p.famille_id and f.mama_id = p.mama_id
left join unites u on u.id = p.unite_id and u.mama_id = p.mama_id
left join lateral (
  select date_livraison, fournisseur_id, actif
    from fournisseur_produits sp
   where sp.produit_id = p.id
     and sp.mama_id = p.mama_id
   order by sp.date_livraison desc
   limit 1
) sp on true;
grant select on v_produits_dernier_prix to authenticated;

-- Colonnes 2FA pour les utilisateurs
alter table users
  add column if not exists two_fa_enabled boolean default false,
  add column if not exists two_fa_secret text;
comment on column users.two_fa_enabled is 'Whether TOTP 2FA is enabled';
comment on column users.two_fa_secret is 'TOTP secret for 2FA';

-- Permettre aux utilisateurs d'activer ou désactiver la 2FA
create or replace function activer_2fa(p_secret text)
returns void language sql security definer
set search_path = public as $$
  update users set two_fa_enabled = true, two_fa_secret = p_secret
  where id = auth.uid();
$$;

create or replace function desactiver_2fa()
returns void language sql security definer
set search_path = public as $$
  update users set two_fa_enabled = false, two_fa_secret = null
  where id = auth.uid();
$$;
grant execute on function activer_2fa(text) to authenticated;
grant execute on function desactiver_2fa() to authenticated;
-- Fonction retournant les produits les plus consommés sur une période
create or replace function produits_les_plus_vendus(
  mama_id_param uuid,
  debut_param date default null,
  fin_param date default null,
  limit_param integer default 5
)
returns table(produit_id uuid, nom text, total numeric)
language sql stable security definer
set search_path = public as $$
  select p.id, p.nom, sum(abs(m.quantite)) as total
  from mouvements_stock m
  join produits p on p.id = m.produit_id
  where m.mama_id = mama_id_param
    and m.quantite < 0
    and (debut_param is null or m.created_at >= debut_param)
    and (fin_param is null or m.created_at < fin_param + interval '1 day')
  group by p.id, p.nom
  order by total desc
  limit limit_param
$$;

-- Mouvements sans affectation de centre de coût
create or replace function mouvements_sans_affectation(limit_param integer default 100)
returns table(id uuid, produit_id uuid, quantite numeric, created_at timestamptz, mama_id uuid)
language sql stable security definer
set search_path = public as $$
  select m.id, m.produit_id, m.quantite, m.created_at, m.mama_id
  from mouvements_stock m
  where m.mama_id = current_user_mama_id()
    and m.quantite < 0
    and not exists (
      select 1 from mouvements_centres_cout mc where mc.mouvement_id = m.id
    )
  order by m.created_at
  limit limit_param;
$$;

-- Index pour la connexion utilisateur par email
DROP INDEX IF EXISTS idx_users_email;
CREATE INDEX idx_users_email ON users(email);


-- Table d'audit des changements de prix
create table if not exists fiche_prix_history (
    id uuid primary key default uuid_generate_v4(),
    fiche_id uuid references fiches_techniques(id) on delete cascade,
    old_prix numeric,
    new_prix numeric,
    changed_by uuid references users(id),
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    changed_at timestamptz default now()
);
DROP INDEX IF EXISTS idx_fiche_prix_history_fiche;
CREATE INDEX idx_fiche_prix_history_fiche ON fiche_prix_history(fiche_id);

alter table fiche_prix_history enable row level security;
alter table fiche_prix_history force row level security;
drop policy if exists fiche_prix_history_all on fiche_prix_history;
create policy fiche_prix_history_all on fiche_prix_history
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on fiche_prix_history to authenticated;

create or replace function journaliser_modif_prix_fiche()
returns trigger language plpgsql as $$
begin
  if new.prix_vente is distinct from old.prix_vente or new.carte_actuelle is distinct from old.carte_actuelle then
    insert into fiche_prix_history (fiche_id, old_prix, new_prix, changed_by, mama_id)
    values (new.id, old.prix_vente, new.prix_vente, auth.uid(), new.mama_id);
  end if;
  return new;
end;
$$;
grant execute on function journaliser_modif_prix_fiche() to authenticated;

drop trigger if exists trg_prix_fiche on fiches_techniques;
drop trigger if exists trg_fiche_prix_change on fiches_techniques;
create trigger trg_prix_fiche
after update on fiches_techniques
for each row execute function journaliser_modif_prix_fiche();

-- Index pour accélérer les requêtes de mouvements


-- Fonction de statistiques pour le tableau de bord
create or replace function stats_tableau_bord(
  mama_id_param uuid,
  page_param integer default 1,
  page_size_param integer default 30
)
returns table(produit_id uuid, nom text, stock_reel numeric, pmp numeric, last_purchase timestamptz)
language sql stable security definer
set search_path = public as $$
  select p.id, p.nom, p.stock_reel, p.pmp, max(f.date_facture) as last_purchase
  from produits p
  left join facture_lignes fl on fl.produit_id = p.id
  left join factures f on f.id = fl.facture_id
  where p.mama_id = mama_id_param
  group by p.id, p.nom, p.stock_reel, p.pmp
  order by p.nom
  limit page_size_param offset greatest((page_param - 1) * page_size_param, 0);
$$;

-- Tables pour le gestionnaire de taches
create table if not exists taches (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    titre text not null,
    description text,
    assignes uuid[] not null default '{}',
    date_debut date not null,
    delai_jours integer,
    date_echeance date not null,
    recurrente boolean not null default false,
    frequence text check (frequence in ('quotidien','hebdomadaire','mensuel')),
    priorite text not null default 'moyenne' check (priorite in ('basse','moyenne','haute')),
    statut text not null default 'a_faire' check (statut in ('a_faire','en_cours','terminee')),
    created_by uuid references utilisateurs(id),
    created_at timestamptz default now(),
    actif boolean default true,
    updated_at timestamptz default now()
);
DROP INDEX IF EXISTS idx_taches_mama;
CREATE INDEX idx_taches_mama ON taches(mama_id);
DROP INDEX IF EXISTS idx_taches_echeance;
CREATE INDEX idx_taches_echeance ON taches(date_echeance);
DROP INDEX IF EXISTS idx_taches_statut;
CREATE INDEX idx_taches_statut ON taches(statut);
DROP INDEX IF EXISTS idx_taches_priorite;
CREATE INDEX idx_taches_priorite ON taches(priorite);

alter table taches enable row level security;
alter table taches force row level security;
drop policy if exists taches_select on taches;
create policy taches_select on taches
  for select using (mama_id = current_user_mama_id());
drop policy if exists taches_insert on taches;
create policy taches_insert on taches
  for insert with check (mama_id = current_user_mama_id() and created_by = auth.uid());
drop policy if exists taches_update on taches;
create policy taches_update on taches
  for update using (mama_id = current_user_mama_id() and (created_by = auth.uid() or auth.uid() = any(assignes)))
  with check (mama_id = current_user_mama_id());
drop policy if exists taches_delete on taches;
create policy taches_delete on taches
  for delete using (mama_id = current_user_mama_id() and created_by = auth.uid());
grant select, insert, update, delete on taches to authenticated;

create table if not exists tache_instances (
    id uuid primary key default uuid_generate_v4(),
    tache_id uuid not null references taches(id) on delete cascade,
    date_echeance date not null,
    statut text not null default 'a_faire' check (statut in ('a_faire','en_cours','fait','reporte','annule')),
    done_by uuid references users(id),
    created_at timestamptz default now(),
    actif boolean default true
);
DROP INDEX IF EXISTS idx_tache_instances_tache;
CREATE INDEX idx_tache_instances_tache ON tache_instances(tache_id);
DROP INDEX IF EXISTS idx_tache_instances_date;
CREATE INDEX idx_tache_instances_date ON tache_instances(date_echeance);
DROP INDEX IF EXISTS idx_tache_instances_statut;
CREATE INDEX idx_tache_instances_statut ON tache_instances(statut);
DROP INDEX IF EXISTS idx_tache_instances_done;
CREATE INDEX idx_tache_instances_done ON tache_instances(done_by);
CREATE INDEX IF NOT EXISTS idx_tache_instances_actif ON tache_instances(actif);

alter table tache_instances enable row level security;
alter table tache_instances force row level security;
drop policy if exists tache_instances_all on tache_instances;
create policy tache_instances_all on tache_instances
  for all using (exists (select 1 from taches where taches.id = tache_instances.tache_id and taches.mama_id = current_user_mama_id()))
  with check (exists (select 1 from taches where taches.id = tache_instances.tache_id and taches.mama_id = current_user_mama_id()));
grant select, insert, update, delete on tache_instances to authenticated;

-- Autoriser l'exécution des fonctions utilitaires
grant execute on function stats_tableau_bord(uuid, integer, integer) to authenticated;
grant execute on function produits_les_plus_vendus(uuid, date, date, integer) to authenticated;
grant execute on function mouvements_sans_affectation(integer) to authenticated;

-- Index pour accélérer la recherche de factures


-- Table des ventes pour l'ingénierie de menu
create table if not exists ventes_fiches_carte (
  id uuid primary key default uuid_generate_v4(),
  fiche_id uuid references fiches_techniques(id) on delete cascade,
  periode date not null,
  ventes integer not null,
  mama_id uuid references mamas(id) not null,
  created_at timestamptz default now(),
    actif boolean default true,
  updated_at timestamptz default now(),
  unique (fiche_id, periode, mama_id)
);
DROP INDEX IF EXISTS idx_vfc_fiche_periode_mama;
CREATE INDEX idx_vfc_fiche_periode_mama ON ventes_fiches_carte(fiche_id, periode, mama_id);
DROP INDEX IF EXISTS idx_vfc_periode;
CREATE INDEX idx_vfc_periode ON ventes_fiches_carte(periode);
CREATE INDEX IF NOT EXISTS idx_ventes_fiches_carte_actif ON ventes_fiches_carte(actif);

alter table ventes_fiches_carte enable row level security;
alter table ventes_fiches_carte force row level security;
drop policy if exists ventes_fiches_carte_all on ventes_fiches_carte;
create policy ventes_fiches_carte_all on ventes_fiches_carte
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on ventes_fiches_carte to authenticated;


-- Module Promotions / Opérations commerciales

create table if not exists promotions (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    nom text not null,
    description text,
    date_debut date not null,
    date_fin date,
    created_at timestamptz default now(),
    actif boolean default true,
    unique (mama_id, nom, date_debut)
);

create table if not exists promotion_produits (
    id uuid primary key default uuid_generate_v4(),
    promotion_id uuid references promotions(id) on delete cascade,
    produit_id uuid references produits(id) on delete cascade,
    discount numeric,
    prix_promo numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    actif boolean default true,
    unique (promotion_id, produit_id)
);

DROP INDEX IF EXISTS idx_promotions_mama;
CREATE INDEX idx_promotions_mama ON promotions(mama_id);
CREATE INDEX IF NOT EXISTS idx_promotions_actif ON promotions(actif);
DROP INDEX IF EXISTS idx_promo_prod_mama;
CREATE INDEX idx_promo_prod_mama ON promotion_produits(mama_id);
DROP INDEX IF EXISTS idx_promo_prod_promotion;
CREATE INDEX idx_promo_prod_promotion ON promotion_produits(promotion_id);
DROP INDEX IF EXISTS idx_promo_prod_produit;
CREATE INDEX idx_promo_prod_produit ON promotion_produits(produit_id);

alter table promotions enable row level security;
alter table promotions force row level security;
drop policy if exists promotions_all on promotions;
create policy promotions_all on promotions
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on promotions to authenticated;

alter table promotion_produits enable row level security;
alter table promotion_produits force row level security;
drop policy if exists promotion_produits_all on promotion_produits;
create policy promotion_produits_all on promotion_produits
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on promotion_produits to authenticated;

create or replace function journaliser_modifs_promotions()
returns trigger language plpgsql as $$
begin
  insert into journaux_utilisateur(mama_id, user_id, action, details, done_by)
  values(coalesce(new.mama_id, old.mama_id), auth.uid(), 'promotions ' || tg_op,
         jsonb_build_object('id_new', new.id, 'id_old', old.id), auth.uid());
  return new;
end;
$$;
grant execute on function journaliser_modifs_promotions() to authenticated;

drop trigger if exists trg_journal_promotions on promotions;
drop trigger if exists trg_log_promotions on promotions;
create trigger trg_journal_promotions
  after insert or update or delete on promotions
  for each row execute function journaliser_modifs_promotions();

-- Vue et fonction pour les statistiques consolidées multi-sites
create or replace view v_stats_consolidees as
select
  m.id as mama_id,
  m.nom,
  m.actif as mama_actif,
  bool_or(p.actif) as produits_actifs,
  coalesce(sum(p.stock_reel * p.pmp),0) as stock_valorise,
  (select count(*) from mouvements_stock ms where ms.mama_id = m.id) as nb_mouvements,
  (select sum(abs(ms.quantite)) from mouvements_stock ms
      where ms.mama_id = m.id and ms.type='sortie'
        and date_trunc('month', ms.date_mouvement) = date_trunc('month', current_date)) as conso_mois
from mamas m
left join produits p on p.mama_id = m.id
group by m.id, m.nom, m.actif;
grant select on v_stats_consolidees to authenticated;

create or replace function stats_consolidees()
returns table(
  mama_id uuid,
  nom text,
  stock_valorise numeric,
  conso_mois numeric,
  nb_mouvements bigint
)
language sql
security definer
set search_path = public as $$
  select * from v_stats_consolidees
  where (
    select r.nom from users u join roles r on r.id = u.role_id where u.id = auth.uid()
  ) = 'superadmin' or mama_id = current_user_mama_id();
$$;

grant execute on function stats_consolidees() to authenticated;

-- Renommer l'ancienne table d'audit si elle existe afin de conserver l'historique
DO $$
BEGIN
  IF to_regclass('public.journal_audit') IS NULL
     AND to_regclass('public.audit_entries') IS NOT NULL THEN
    ALTER TABLE audit_entries RENAME TO journal_audit;
  END IF;
END $$;

-- Journal avancé conforme aux obligations légales
create table if not exists journal_audit (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    table_name text not null,
    row_id uuid,
    operation text not null,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid references users(id) on delete set null,
    created_at timestamptz default now(),
    actif boolean default true,
    changed_at timestamptz default now()
);
DROP INDEX IF EXISTS idx_journal_audit_mama;
CREATE INDEX idx_journal_audit_mama ON journal_audit(mama_id);
DROP INDEX IF EXISTS idx_journal_audit_table;
CREATE INDEX idx_journal_audit_table ON journal_audit(table_name);
DROP INDEX IF EXISTS idx_journal_audit_date;
CREATE INDEX idx_journal_audit_date ON journal_audit(changed_at);

alter table journal_audit enable row level security;
alter table journal_audit force row level security;
drop policy if exists journal_audit_all on journal_audit;
create policy journal_audit_all on journal_audit
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select on journal_audit to authenticated;

create or replace function ajouter_entree_audit()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into journal_audit(mama_id, table_name, row_id, operation, old_data, new_data, changed_by)
  values(coalesce(new.mama_id, old.mama_id), TG_TABLE_NAME, coalesce(new.id, old.id), TG_OP, to_jsonb(old), to_jsonb(new), auth.uid());
  return new;
end;
$$;
grant execute on function ajouter_entree_audit() to authenticated;

drop trigger if exists trg_audit_produits on produits;
create trigger trg_audit_produits
  after insert or update or delete on produits
  for each row execute function ajouter_entree_audit();
drop trigger if exists trg_audit_factures on factures;
create trigger trg_audit_factures
  after insert or update or delete on factures
  for each row execute function ajouter_entree_audit();

-- Planning prévisionnel des besoins
create table if not exists planning_previsionnel (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    date_prevue date not null,
    notes text,
    created_by uuid references users(id) on delete set null,
    created_at timestamptz default now()
);
DROP INDEX IF EXISTS idx_planning_mama;
CREATE INDEX idx_planning_mama ON planning_previsionnel(mama_id, date_prevue);
alter table planning_previsionnel enable row level security;
alter table planning_previsionnel force row level security;
drop policy if exists planning_previsionnel_all on planning_previsionnel;
create policy planning_previsionnel_all on planning_previsionnel
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on planning_previsionnel to authenticated;
drop trigger if exists trg_audit_planning on planning_previsionnel;
create trigger trg_audit_planning
  after insert or update or delete on planning_previsionnel
  for each row execute function ajouter_entree_audit();

-- Conserver les anciennes tables si elles existent en les renommant
DO $$
BEGIN
  IF to_regclass('public.regles_alertes') IS NULL
     AND to_regclass('public.alert_rules') IS NOT NULL THEN
    ALTER TABLE alert_rules RENAME TO regles_alertes;
  END IF;
  IF to_regclass('public.journaux_alertes') IS NULL
     AND to_regclass('public.alert_logs') IS NOT NULL THEN
    ALTER TABLE alert_logs RENAME TO journaux_alertes;
  END IF;
END $$;
create table if not exists regles_alertes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    produit_id uuid references produits(id) on delete cascade,
    threshold numeric not null,
    message text,
    created_at timestamptz default now()
);
DROP INDEX IF EXISTS idx_regles_alertes_mama;
CREATE INDEX idx_regles_alertes_mama ON regles_alertes(mama_id);
alter table regles_alertes enable row level security;
alter table regles_alertes force row level security;
drop policy if exists regles_alertes_all on regles_alertes;
create policy regles_alertes_all on regles_alertes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
  grant select, insert, update, delete on regles_alertes to authenticated;

create table if not exists journaux_alertes (
    id uuid primary key default uuid_generate_v4(),
  regle_id uuid references regles_alertes(id) on delete cascade,
    mama_id uuid not null references mamas(id) on delete cascade,
    produit_id uuid references produits(id) on delete cascade,
    stock_reel numeric,
    created_at timestamptz default now()
);
DROP INDEX IF EXISTS idx_journaux_alertes_mama;
CREATE INDEX idx_journaux_alertes_mama ON journaux_alertes(mama_id);
alter table journaux_alertes enable row level security;
alter table journaux_alertes force row level security;
drop policy if exists journaux_alertes_all on journaux_alertes;
create policy journaux_alertes_all on journaux_alertes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
  grant select on journaux_alertes to authenticated;

create or replace function verifier_alerte_stock()
returns trigger language plpgsql as $$
declare
  r record;
begin
  for r in
    select * from regles_alertes
    where actif and mama_id = new.mama_id
      and (produit_id is null or produit_id = new.id)
  loop
    if new.stock_reel < r.threshold then
      insert into journaux_alertes(regle_id, mama_id, produit_id, stock_reel)
        values (r.id, new.mama_id, new.id, new.stock_reel);
    end if;
  end loop;
  return new;
end;
$$;

grant execute on function verifier_alerte_stock() to authenticated;

drop trigger if exists trg_alerte_stock on produits;
drop trigger if exists trg_stock_alert on produits;
create trigger trg_alerte_stock
  after update of stock_reel on produits
  for each row execute function verifier_alerte_stock();


-- Import automatique des factures electroniques
-- Renommer l'ancienne table d'import si elle existe pour conserver les données
DO $$
BEGIN
  IF to_regclass('public.factures_importees') IS NULL
     AND to_regclass('public.incoming_invoices') IS NOT NULL THEN
    ALTER TABLE incoming_invoices RENAME TO factures_importees;
  END IF;
END $$;
create table if not exists factures_importees (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    fournisseur_id uuid references fournisseurs(id) on delete set null,
    payload jsonb not null,
    processed boolean default false,
    created_at timestamptz default now()
);
DROP INDEX IF EXISTS idx_factures_importees_mama;
CREATE INDEX idx_factures_importees_mama ON factures_importees(mama_id);

alter table factures_importees enable row level security;
alter table factures_importees force row level security;
drop policy if exists factures_importees_all on factures_importees;
create policy factures_importees_all on factures_importees
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on factures_importees to authenticated;

create or replace function importer_facture(payload jsonb)
returns uuid language plpgsql security definer
set search_path = public as $$
declare
  fac_id uuid;
  supp_id uuid;
begin
  select id into supp_id from fournisseurs
    where nom = payload->>'supplier_name'
      and mama_id = current_user_mama_id()
    limit 1;
  insert into factures(reference, date_facture, fournisseur_id, montant, statut, mama_id)
    values (payload->>'reference', (payload->>'date')::date, supp_id,
            (payload->>'total')::numeric, 'en attente', current_user_mama_id())
    returning id into fac_id;
  insert into facture_lignes(facture_id, produit_id, quantite, prix_unitaire, mama_id)
  select fac_id, p.id, (l->>'quantity')::numeric, (l->>'unit_price')::numeric, current_user_mama_id()
  from jsonb_array_elements(payload->'lines') as l
  left join produits p on p.code = l->>'product_code' and p.mama_id = current_user_mama_id();
  return fac_id;
end;
$$;

grant execute on function importer_facture(jsonb) to authenticated;

-- Gestion documentaire avancée
create table if not exists documents (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    title text not null,
    file_url text not null,
    uploaded_by uuid references users(id) on delete set null,
    created_at timestamptz default now()
);
DROP INDEX IF EXISTS idx_documents_mama;
CREATE INDEX idx_documents_mama ON documents(mama_id);

alter table documents enable row level security;
alter table documents force row level security;
drop policy if exists documents_all on documents;
create policy documents_all on documents
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on documents to authenticated;

create table if not exists consentements_utilisateur (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade,
    mama_id uuid,
    consentement boolean,
    date_consentement timestamptz default now()
);

alter table consentements_utilisateur enable row level security;
alter table consentements_utilisateur force row level security;
drop policy if exists user_own_consent on consentements_utilisateur;
create policy user_own_consent on consentements_utilisateur
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- Renommer l'ancienne table 2FA si nécessaire
DO $$
BEGIN
  IF to_regclass('public.auth_double_facteur') IS NULL
     AND to_regclass('public.two_factor_auth') IS NOT NULL THEN
    ALTER TABLE public.two_factor_auth RENAME TO auth_double_facteur;
  END IF;
END $$;
create table if not exists public.auth_double_facteur (
    id uuid primary key references auth.users(id) on delete cascade,
    secret text,
    enabled boolean default false,
    created_at timestamptz default now()
);
alter table public.auth_double_facteur enable row level security;
alter table public.auth_double_facteur force row level security;
drop policy if exists two_factor_select on public.auth_double_facteur;
create policy two_factor_select on public.auth_double_facteur
  for select using (auth.uid() = id);
drop policy if exists two_factor_upsert on public.auth_double_facteur;
create policy two_factor_upsert on public.auth_double_facteur
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ----------------------------------------------------
-- Vues Supabase supplémentaires
-- ----------------------------------------------------
create or replace view v_analytique_stock as
select
  m.date_mouvement,
  m.produit_id,
  f.nom as famille,
  f.actif as famille_actif,
  mc.centre_cout_id,
  c.nom as centre_cout_nom,
  c.actif as centre_cout_actif,
  m.quantite,
  mc.valeur,
  m.mama_id,
  m.actif as mouvement_actif,
  mc.actif as mouvement_centre_cout_actif,
  p.actif as produit_actif
from mouvements_stock m
left join mouvements_centres_cout mc on mc.mouvement_id = m.id
left join centres_de_cout c on c.id = mc.centre_cout_id
left join produits p on p.id = m.produit_id
left join familles f on f.id = p.famille_id and f.mama_id = p.mama_id;
grant select on v_analytique_stock to authenticated;

create or replace view v_reco_rotation as
select
  p.id as produit_id,
  p.nom,
  p.mama_id,
  p.actif as produit_actif,
  current_date - coalesce(max(m.date_mouvement), current_date) as jours_inactif
from produits p
left join mouvements_stock m on m.produit_id = p.id
where p.actif = true
group by p.id, p.nom, p.mama_id, p.actif;
grant select on v_reco_rotation to authenticated;

create or replace view v_reco_stockmort as
select * from v_reco_rotation
where jours_inactif > 30;
grant select on v_reco_stockmort to authenticated;

create or replace view v_besoins_previsionnels as
select
  m.mama_id,
  m.id as menu_id,
  fl.produit_id,
  sum(fl.quantite * coalesce(f.portions,1)) as quantite,
  sum(fl.quantite * coalesce(f.portions,1) * coalesce(p.pmp,0)) as valeur,
  p.nom as nom_produit,
  bool_or(m.actif) as menu_actif,
  bool_or(mf.actif) as menu_fiche_actif,
  bool_or(f.actif) as fiche_actif,
  bool_or(fl.actif) as fiche_ligne_actif,
  bool_or(p.actif) as produit_actif
from menus m
join menu_fiches mf on mf.menu_id = m.id
join fiches f on f.id = mf.fiche_id
join fiche_lignes fl on fl.fiche_id = f.id
left join produits p on p.id = fl.produit_id
group by m.mama_id, m.id, fl.produit_id, p.nom, p.pmp;
grant select on v_besoins_previsionnels to authenticated;

create or replace view v_reco_surcoût as
select distinct on (sp.produit_id)
  sp.produit_id,
  p.nom,
  p.mama_id,
  p.actif as produit_actif,
  sp.actif as fournisseur_produit_actif,
  sp.prix_achat as dernier_prix,
  lag(sp.prix_achat) over (partition by sp.produit_id order by sp.date_livraison) as prix_precedent,
  (sp.prix_achat - lag(sp.prix_achat) over (partition by sp.produit_id order by sp.date_livraison))
    / nullif(lag(sp.prix_achat) over (partition by sp.produit_id order by sp.date_livraison),0) * 100 as variation_pct
  from fournisseur_produits sp
join produits p on p.id = sp.produit_id
where p.actif = true
order by sp.produit_id, sp.date_livraison desc;
grant select on v_reco_surcoût to authenticated;

-- ----------------------------------------------------
-- Fonctions Supabase supplémentaires
-- ----------------------------------------------------
create or replace function purger_utilisateurs_inactifs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from users
  where actif = false
    and created_at < now() - interval '2 years';
end;
$$;
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'schedule' and n.nspname = 'cron'
  ) then
    if not exists (select 1 from cron.job where jobname = 'purge_utilisateurs_inactifs') then
      perform cron.schedule('purge_utilisateurs_inactifs', '0 3 * * *', 'call purger_utilisateurs_inactifs();');
    end if;
  else
    raise notice 'cron.schedule not available';
  end if;
END $$;

create or replace function calculer_budgets(mama_id_param uuid, periode_param text)
returns table(famille text, budget_prevu numeric, total_reel numeric, ecart_pct numeric)
language sql as $$
  with hist as (
  select to_char(f.date_facture,'YYYY-MM') as mois,
           fam.nom as famille,
           sum(fl.total) as total
    from factures f
      join facture_lignes fl on fl.facture_id = f.id
      left join produits p on p.id = fl.produit_id
      left join familles fam on fam.id = p.famille_id
    where f.mama_id = mama_id_param
    group by 1,2
  ),
  moy as (
    select famille, avg(total) as avg_mensuel
    from hist
    where mois < periode_param
    group by famille
  ),
  courant as (
    select famille, sum(total) as total_reel
    from hist
    where mois = periode_param
    group by famille
  )
  select coalesce(m.famille, c.famille) as famille,
         coalesce(m.avg_mensuel,0) as budget_prevu,
         coalesce(c.total_reel,0) as total_reel,
         case when coalesce(m.avg_mensuel,0) = 0 then null
              else (coalesce(c.total_reel,0) - m.avg_mensuel)/m.avg_mensuel * 100
         end as ecart_pct
  from moy m
  full join courant c on c.famille = m.famille;
$$;
grant execute on function calculer_budgets(uuid, text) to authenticated;

-- Configuration API fournisseurs
create table if not exists fournisseurs_api_config (
  fournisseur_id uuid references fournisseurs(id) on delete cascade,
  mama_id uuid not null references mamas(id),
  url text,
  type_api text default 'rest',
  token text,
  format_facture text default 'json',
  created_at timestamptz default now(),
    actif boolean default true,
  primary key(fournisseur_id, mama_id)
);
-- Renomme product_id en produit_id si nécessaire
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='facture_lignes' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='facture_lignes' AND column_name='produit_id'
  ) THEN
    PERFORM renommer_colonne_public('facture_lignes','product_id','produit_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='facture_lignes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiche_lignes' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiche_lignes' AND column_name='produit_id'
  ) THEN
    PERFORM renommer_colonne_public('fiche_lignes','product_id','produit_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiche_lignes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE fiche_lignes ADD COLUMN IF NOT EXISTS produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaire_lignes' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaire_lignes' AND column_name='produit_id'
  ) THEN
    PERFORM renommer_colonne_public('inventaire_lignes','product_id','produit_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaire_lignes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE inventaire_lignes ADD COLUMN IF NOT EXISTS produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='produit_id'
  ) THEN
    PERFORM renommer_colonne_public('mouvements_stock','product_id','produit_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='produit_id'
  ) THEN
    ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='produit_id'
  ) THEN
    PERFORM renommer_colonne_public('requisitions','product_id','produit_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='produit_id'
  ) THEN
    ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS produit_id uuid references produits(id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='transferts' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='transferts' AND column_name='produit_id'
  ) THEN
    PERFORM renommer_colonne_public('transferts','product_id','produit_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='transferts' AND column_name='produit_id'
  ) THEN
    ALTER TABLE transferts ADD COLUMN IF NOT EXISTS produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'pertes'
      AND c.relkind IN ('r','p')
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='pertes' AND column_name='product_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='pertes' AND column_name='produit_id'
    ) THEN
      PERFORM renommer_colonne_public('pertes','product_id','produit_id');
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='pertes' AND column_name='produit_id'
    ) THEN
      ALTER TABLE pertes ADD COLUMN IF NOT EXISTS produit_id uuid references produits(id);
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'promotion_produits'
      AND c.relkind IN ('r','p')
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='promotion_produits' AND column_name='product_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='promotion_produits' AND column_name='produit_id'
    ) THEN
      PERFORM renommer_colonne_public('promotion_produits','product_id','produit_id');
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='promotion_produits' AND column_name='produit_id'
    ) THEN
      ALTER TABLE promotion_produits ADD COLUMN IF NOT EXISTS produit_id uuid references produits(id) on delete cascade;
    END IF;
  END IF;

  -- Harmonisation de la colonne zone_id dans requisitions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='zone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='zone_id'
  ) THEN
    PERFORM renommer_colonne_public('requisitions','zone','zone_id');
  ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='requisitions' AND column_name='zone_id'
  ) THEN
      ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS zone_id uuid references zones_stock(id);
  END IF;
END $$;

-- Harmonisation des colonnes encore en anglais
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='produits' AND column_name='main_supplier_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='produits' AND column_name='fournisseur_principal_id'
  ) THEN
    PERFORM renommer_colonne_public('produits','main_supplier_id','fournisseur_principal_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='produits' AND column_name='fournisseur_principal_id'
  ) THEN
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS fournisseur_principal_id uuid references fournisseurs(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_centres_cout' AND column_name='cost_center_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_centres_cout' AND column_name='centre_cout_id'
  ) THEN
    PERFORM renommer_colonne_public('mouvements_centres_cout','cost_center_id','centre_cout_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_centres_cout' AND column_name='centre_cout_id'
  ) THEN
    ALTER TABLE mouvements_centres_cout ADD COLUMN IF NOT EXISTS centre_cout_id uuid references centres_de_cout(id) on delete cascade;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='pertes' AND column_name='cost_center_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='pertes' AND column_name='centre_cout_id'
  ) THEN
    PERFORM renommer_colonne_public('pertes','cost_center_id','centre_cout_id');
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='pertes' AND column_name='centre_cout_id'
  ) THEN
    ALTER TABLE pertes ADD COLUMN IF NOT EXISTS centre_cout_id uuid references centres_de_cout(id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'v_product_price_trend'
      AND c.relkind IN ('v','m')
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'v_product_price_trend'
      AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'v_product_price_trend'
      AND column_name = 'produit_id'
  ) THEN
    PERFORM renommer_colonne_public('v_product_price_trend','product_id','produit_id');
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'v_products_last_price'
      AND c.relkind IN ('v','m')
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'v_products_last_price'
      AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'v_products_last_price'
      AND column_name = 'produit_id'
  ) THEN
    PERFORM renommer_colonne_public('v_products_last_price','product_id','produit_id');
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'stock_mouvements'
      AND c.relkind IN ('v','m')
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stock_mouvements'
      AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stock_mouvements'
      AND column_name = 'produit_id'
  ) THEN
    PERFORM renommer_colonne_public('stock_mouvements','product_id','produit_id');
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'stocks'
      AND c.relkind IN ('v','m')
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stocks'
      AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stocks'
      AND column_name = 'produit_id'
  ) THEN
    PERFORM renommer_colonne_public('stocks','product_id','produit_id');
  END IF;
END $$;
-- Ajout des colonnes zone_source_id et zone_destination_id si absentes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name='mouvements_stock'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='mouvements_stock' AND column_name='zone_source_id'
    ) THEN
      ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS zone_source_id uuid references zones_stock(id);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='mouvements_stock' AND column_name='zone_destination_id'
    ) THEN
      ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS zone_destination_id uuid references zones_stock(id);
    END IF;
  END IF;
END $$;

-- Ajout de la colonne auteur_id sur mouvements_stock et requisitions si absente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name='mouvements_stock'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='mouvements_stock' AND column_name='auteur_id'
    ) THEN
      ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS auteur_id uuid references utilisateurs(id);
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name='requisitions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='requisitions' AND column_name='auteur_id'
    ) THEN
      ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS auteur_id uuid references utilisateurs(id);
    END IF;
  END IF;
END $$;

-- Harmonisation des noms de colonnes date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='factures' AND column_name='date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='factures' AND column_name='date_facture'
  ) THEN
    PERFORM renommer_colonne_public('factures','date','date_facture');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiche_cout_history' AND column_name='date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiche_cout_history' AND column_name='date_cout'
  ) THEN
    PERFORM renommer_colonne_public('fiche_cout_history','date','date_cout');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaires' AND column_name='date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaires' AND column_name='date_inventaire'
  ) THEN
    PERFORM renommer_colonne_public('inventaires','date','date_inventaire');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='date_mouvement'
  ) THEN
    PERFORM renommer_colonne_public('mouvements_stock','date','date_mouvement');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='date'
  ) THEN
    ALTER TABLE requisitions RENAME COLUMN date TO date_requisition;
  END IF;
END $$;

ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS utilisateurs ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS fournisseurs ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS produits ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS familles ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS unites ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS fiches ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS fiches_techniques ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS zones_stock ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS permissions ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS menus ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS mamas ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS roles ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS centres_de_cout ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS promotions ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS regles_alertes ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS taches ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS fournisseurs_api_config ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;

-- Migration de l'ancienne colonne enabled de regles_alertes si présente
ALTER TABLE IF EXISTS regles_alertes ADD COLUMN IF NOT EXISTS enabled boolean;
UPDATE regles_alertes SET actif = COALESCE(actif, enabled);
ALTER TABLE IF EXISTS regles_alertes DROP COLUMN IF EXISTS enabled;

-- Bloc de migration pour les bases deja existantes :
-- ajoute les nouvelles colonnes et renseigne les valeurs manquantes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'produits'
      AND column_name  = 'dernier_prix'
  ) THEN
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS dernier_prix numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fournisseur_produits'
      AND column_name  = 'updated_at'
  ) THEN
    ALTER TABLE fournisseur_produits
      ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  ALTER TABLE fournisseur_produits
    ALTER COLUMN updated_at SET DEFAULT now();
  UPDATE fournisseur_produits
     SET updated_at = now()
   WHERE updated_at IS NULL;

  -- Renseigner le dernier prix des produits manquants
  UPDATE produits p
     SET dernier_prix = fp.prix_achat,
         fournisseur_principal_id = coalesce(p.fournisseur_principal_id, fp.fournisseur_id)
    FROM (
      SELECT DISTINCT ON (produit_id) produit_id, prix_achat, fournisseur_id, mama_id
        FROM fournisseur_produits
       ORDER BY produit_id, date_livraison DESC
    ) fp
   WHERE p.id = fp.produit_id
     AND p.mama_id = fp.mama_id
     AND p.dernier_prix IS NULL;
END $$;
DROP INDEX IF EXISTS idx_fournisseurs_api_config_fourn;
CREATE INDEX idx_fournisseurs_api_config_fourn ON fournisseurs_api_config(fournisseur_id);
DROP INDEX IF EXISTS idx_fournisseurs_api_config_mama;
CREATE INDEX idx_fournisseurs_api_config_mama ON fournisseurs_api_config(mama_id);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_api_config_actif ON fournisseurs_api_config(actif);
alter table fournisseurs_api_config enable row level security;
alter table fournisseurs_api_config force row level security;
drop policy if exists fournisseurs_api_config_all on fournisseurs_api_config;
create policy fournisseurs_api_config_all on fournisseurs_api_config
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- L'inscription manuelle renseigne désormais la table utilisateurs, aucun trigger sur auth.users n'est nécessaire
-- Indexes
DROP INDEX IF EXISTS idx_users_mama;
CREATE INDEX idx_users_mama ON users(mama_id);
DROP INDEX IF EXISTS idx_users_role;
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_actif ON users(actif);
CREATE INDEX IF NOT EXISTS idx_roles_actif ON roles(actif);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_actif ON utilisateurs(actif);
DROP INDEX IF EXISTS idx_fournisseurs_mama;
CREATE INDEX idx_fournisseurs_mama ON fournisseurs(mama_id);
DROP INDEX IF EXISTS idx_fournisseurs_nom;
CREATE INDEX idx_fournisseurs_nom ON fournisseurs(nom);
DROP INDEX IF EXISTS idx_fournisseurs_ville;
CREATE INDEX idx_fournisseurs_ville ON fournisseurs(ville);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_actif ON fournisseurs(actif);
DROP INDEX IF EXISTS idx_produits_mama;
CREATE INDEX idx_produits_mama ON produits(mama_id);
DROP INDEX IF EXISTS idx_produits_nom;
CREATE INDEX idx_produits_nom ON produits(nom);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON produits(actif);
DROP INDEX IF EXISTS idx_produits_famille;
CREATE INDEX idx_produits_famille ON produits(famille_id);
DROP INDEX IF EXISTS idx_produits_unite;
CREATE INDEX idx_produits_unite ON produits(unite_id);
DROP INDEX IF EXISTS idx_produits_fournisseur_principal;
CREATE INDEX idx_produits_fournisseur_principal ON produits(fournisseur_principal_id);
DROP INDEX IF EXISTS idx_factures_mama;
CREATE INDEX idx_factures_mama ON factures(mama_id);
DROP INDEX IF EXISTS idx_factures_date;
CREATE INDEX idx_factures_date ON factures(date_facture);
DROP INDEX IF EXISTS idx_factures_fournisseur;
CREATE INDEX idx_factures_fournisseur ON factures(fournisseur_id);
DROP INDEX IF EXISTS idx_factures_statut;
CREATE INDEX idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_actif ON factures(actif);
DROP INDEX IF EXISTS idx_fiches_mama;
CREATE INDEX idx_fiches_mama ON fiches(mama_id);
DROP INDEX IF EXISTS idx_fiches_nom;
CREATE INDEX idx_fiches_nom ON fiches(nom);
CREATE INDEX IF NOT EXISTS idx_fiches_actif ON fiches(actif);
DROP INDEX IF EXISTS idx_fiches_famille;
CREATE INDEX idx_fiches_famille ON fiches(famille_id);
DROP INDEX IF EXISTS idx_inventaires_mama;
CREATE INDEX idx_inventaires_mama ON inventaires(mama_id);
CREATE INDEX IF NOT EXISTS idx_inventaires_actif ON inventaires(actif);
DROP INDEX IF EXISTS idx_familles_mama;
CREATE INDEX idx_familles_mama ON familles(mama_id);
CREATE INDEX IF NOT EXISTS idx_familles_actif ON familles(actif);
DROP INDEX IF EXISTS idx_unites_mama;
CREATE INDEX idx_unites_mama ON unites(mama_id);
CREATE INDEX IF NOT EXISTS idx_unites_actif ON unites(actif);
DROP INDEX IF EXISTS idx_fournisseur_produits_mama;
CREATE INDEX idx_fournisseur_produits_mama ON fournisseur_produits(mama_id);
DROP INDEX IF EXISTS idx_fournisseur_produits_produit;
CREATE INDEX idx_fournisseur_produits_produit ON fournisseur_produits(produit_id);
DROP INDEX IF EXISTS idx_fournisseur_produits_fournisseur;
CREATE INDEX idx_fournisseur_produits_fournisseur ON fournisseur_produits(fournisseur_id);
DROP INDEX IF EXISTS idx_fournisseur_produits_produit_date;
CREATE INDEX idx_fournisseur_produits_produit_date ON fournisseur_produits(produit_id, date_livraison desc);
CREATE INDEX IF NOT EXISTS idx_fournisseur_produits_actif ON fournisseur_produits(actif);
DROP INDEX IF EXISTS idx_facture_lignes_mama;
CREATE INDEX idx_facture_lignes_mama ON facture_lignes(mama_id);
DROP INDEX IF EXISTS idx_facture_lignes_facture;
CREATE INDEX idx_facture_lignes_facture ON facture_lignes(facture_id);
DROP INDEX IF EXISTS idx_facture_lignes_produit;
CREATE INDEX idx_facture_lignes_produit ON facture_lignes(produit_id);
CREATE INDEX IF NOT EXISTS idx_facture_lignes_actif ON facture_lignes(actif);
DROP INDEX IF EXISTS idx_fiche_lignes_mama;
CREATE INDEX idx_fiche_lignes_mama ON fiche_lignes(mama_id);
DROP INDEX IF EXISTS idx_fiche_lignes_fiche;
CREATE INDEX idx_fiche_lignes_fiche ON fiche_lignes(fiche_id);
DROP INDEX IF EXISTS idx_fiche_lignes_produit;
CREATE INDEX idx_fiche_lignes_produit ON fiche_lignes(produit_id);
CREATE INDEX IF NOT EXISTS idx_fiche_lignes_actif ON fiche_lignes(actif);
DROP INDEX IF EXISTS idx_fiche_cout_history_mama;
CREATE INDEX idx_fiche_cout_history_mama ON fiche_cout_history(mama_id);
DROP INDEX IF EXISTS idx_fiche_cout_history_fiche;
CREATE INDEX idx_fiche_cout_history_fiche ON fiche_cout_history(fiche_id);
CREATE INDEX IF NOT EXISTS idx_fiche_cout_history_actif ON fiche_cout_history(actif);
DROP INDEX IF EXISTS idx_inventaire_lignes_mama;
CREATE INDEX idx_inventaire_lignes_mama ON inventaire_lignes(mama_id);
DROP INDEX IF EXISTS idx_inventaire_lignes_inventaire;
CREATE INDEX idx_inventaire_lignes_inventaire ON inventaire_lignes(inventaire_id);
DROP INDEX IF EXISTS idx_inventaire_lignes_produit;
CREATE INDEX idx_inventaire_lignes_produit ON inventaire_lignes(produit_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_lignes_actif ON inventaire_lignes(actif);
DROP INDEX IF EXISTS idx_parametres_mama;
CREATE INDEX idx_parametres_mama ON parametres(mama_id);
DROP INDEX IF EXISTS idx_fournisseur_contacts_mama;
CREATE INDEX idx_fournisseur_contacts_mama ON fournisseur_contacts(mama_id);
DROP INDEX IF EXISTS idx_fournisseur_contacts_fournisseur;
CREATE INDEX idx_fournisseur_contacts_fournisseur ON fournisseur_contacts(fournisseur_id);
DROP INDEX IF EXISTS idx_fournisseur_notes_mama;
CREATE INDEX idx_fournisseur_notes_mama ON fournisseur_notes(mama_id);
DROP INDEX IF EXISTS idx_fournisseur_notes_fournisseur;
CREATE INDEX idx_fournisseur_notes_fournisseur ON fournisseur_notes(fournisseur_id);
DROP INDEX IF EXISTS idx_permissions_mama;
CREATE INDEX idx_permissions_mama ON permissions(mama_id);
DROP INDEX IF EXISTS idx_permissions_role;
CREATE INDEX idx_permissions_role ON permissions(role_id);
DROP INDEX IF EXISTS idx_permissions_user;
CREATE INDEX idx_permissions_user ON permissions(user_id);
DROP INDEX IF EXISTS idx_menus_mama;
CREATE INDEX idx_menus_mama ON menus(mama_id);
DROP INDEX IF EXISTS idx_menus_date;
CREATE INDEX idx_menus_date ON menus("date");
CREATE INDEX IF NOT EXISTS idx_menus_actif ON menus(actif);
DROP INDEX IF EXISTS idx_menu_fiches_menu;
CREATE INDEX idx_menu_fiches_menu ON menu_fiches(menu_id);
DROP INDEX IF EXISTS idx_menu_fiches_fiche;
CREATE INDEX idx_menu_fiches_fiche ON menu_fiches(fiche_id);
DROP INDEX IF EXISTS idx_requisitions_mama;
CREATE INDEX idx_requisitions_mama ON requisitions(mama_id);
DROP INDEX IF EXISTS idx_requisitions_produit;
CREATE INDEX idx_requisitions_produit ON requisitions(produit_id);
DROP INDEX IF EXISTS idx_requisitions_zone;
CREATE INDEX idx_requisitions_zone ON requisitions(zone_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_actif ON requisitions(actif);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='fiche_produits' AND relkind IN ('r','p')) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_fiche_produits_actif ON fiche_produits(actif)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='boissons' AND relkind IN ('r','p')) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_boissons_actif ON boissons(actif)';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='access_rights_templates' AND relkind IN (''r'',''p'')) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_access_rights_templates_actif ON access_rights_templates(actif)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_regles_alertes_actif ON regles_alertes(actif);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='produits' AND column_name='famille'
  ) THEN
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS famille text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='produits' AND column_name='unite'
  ) THEN
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS unite text;
  END IF;
END $$;

-- Contraintes uniques sur (mama_id, nom, unite)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'produits_mama_id_nom_unite_key'
  ) THEN
    ALTER TABLE produits
      ADD CONSTRAINT produits_mama_id_nom_unite_key UNIQUE (mama_id, nom, unite);
  END IF;
END $$;

-- ---------------------------------------
-- Module Carte - champs additionnels
-- ---------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiches_techniques' AND column_name='carte_actuelle'
  ) THEN
    ALTER TABLE fiches_techniques ADD COLUMN IF NOT EXISTS carte_actuelle boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiches_techniques' AND column_name='type_carte'
  ) THEN
    ALTER TABLE fiches_techniques ADD COLUMN IF NOT EXISTS type_carte text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiches_techniques' AND column_name='sous_type_carte'
  ) THEN
    ALTER TABLE fiches_techniques ADD COLUMN IF NOT EXISTS sous_type_carte text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiches_techniques' AND column_name='prix_vente'
  ) THEN
    ALTER TABLE fiches_techniques ADD COLUMN IF NOT EXISTS prix_vente numeric;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_ft_carte;
CREATE INDEX idx_ft_carte ON fiches_techniques(carte_actuelle, type_carte, sous_type_carte);
DROP INDEX IF EXISTS idx_ft_prix;
CREATE INDEX idx_ft_prix ON fiches_techniques(prix_vente);
DROP INDEX IF EXISTS idx_ft_nom;
CREATE INDEX idx_ft_nom ON fiches_techniques(nom);
DROP INDEX IF EXISTS idx_ft_mama;
CREATE INDEX idx_ft_mama ON fiches_techniques(mama_id);
CREATE INDEX IF NOT EXISTS idx_ft_actif ON fiches_techniques(actif);

alter table fiches_techniques enable row level security;
alter table fiches_techniques force row level security;
drop policy if exists fiches_techniques_all on fiches_techniques;
create policy fiches_techniques_all on fiches_techniques
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

grant select, insert, update, delete on fiches_techniques to authenticated;
-- ----------------------------------------------------
-- Fin du schéma
-- ----------------------------------------------------

-- Résumé : schéma unifié pour MamaStock

-- ----------------------------------------------------
-- Création du compte admin initial
-- ----------------------------------------------------

-- S'assurer de l'existence des rôles requis
insert into roles (nom, description) values
  ('superadmin', 'Super administrateur'),
  ('admin', 'Administrateur'),
  ('user', 'Utilisateur')
  on conflict (nom) do nothing;

-- S'assurer que la Mama de Lyon existe
insert into mamas(id, nom, created_at)
values ('29c992df-f6b0-47c5-9afa-c965b789aa07', 'Mama de Lyon', now())
on conflict (id) do nothing;

-- Enregistrer aussi cet utilisateur dans auth.users pour la FK
insert into auth.users(id, email)
values ('a49aeafd-6f60-4f68-a267-d7d27c1a1381', 'admin@mamastock.com')
on conflict (id) do nothing;

-- Création de l'utilisateur admin avec tous les droits pour la Mama de Lyon
insert into users(id, email, password, role_id, access_rights, actif, mama_id)
values (
  'a49aeafd-6f60-4f68-a267-d7d27c1a1381',
  'admin@mamastock.com',
  crypt('vegeta', gen_salt('bf')),
  (select id from roles where nom = 'admin'),
  '[]',
  true,
  '29c992df-f6b0-47c5-9afa-c965b789aa07'
) on conflict (id) do nothing;

-- Index pour accélérer la gestion du stock
DROP INDEX IF EXISTS idx_mouvements_stock_mama;
CREATE INDEX idx_mouvements_stock_mama ON mouvements_stock(mama_id);
DROP INDEX IF EXISTS idx_mouvements_stock_produit;
CREATE INDEX idx_mouvements_stock_produit ON mouvements_stock(produit_id);
DROP INDEX IF EXISTS idx_mouvements_stock_date;
CREATE INDEX idx_mouvements_stock_date ON mouvements_stock(date_mouvement);
DROP INDEX IF EXISTS idx_mouvements_stock_type;
CREATE INDEX idx_mouvements_stock_type ON mouvements_stock(type);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_actif ON mouvements_stock(actif);

-- Ajout de la colonne date_debut pour les inventaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaires' AND column_name='date_debut'
  ) THEN
    ALTER TABLE inventaires ADD COLUMN IF NOT EXISTS date_debut date;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_inventaires_date;
CREATE INDEX idx_inventaires_date ON inventaires(date_inventaire);
DROP INDEX IF EXISTS idx_inventaires_date_debut;
CREATE INDEX idx_inventaires_date_debut ON inventaires(date_debut);

DROP INDEX IF EXISTS idx_produits_famille_txt;
CREATE INDEX idx_produits_famille_txt ON produits(famille);
DROP INDEX IF EXISTS idx_produits_unite_txt;
CREATE INDEX idx_produits_unite_txt ON produits(unite);
DROP INDEX IF EXISTS idx_produits_code;
CREATE INDEX idx_produits_code ON produits(code);

-- Index pour accélérer la recherche de factures
DROP INDEX IF EXISTS idx_factures_reference;
CREATE INDEX idx_factures_reference ON factures(reference);

-- Colonnes optionnelles sur mouvements_stock pour stocker les détails
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='sous_type'
  ) THEN
    ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS sous_type text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='zone'
  ) THEN
    ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS zone text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='motif'
  ) THEN
    ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS motif text;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_mouvements_stock_sous_type;
CREATE INDEX idx_mouvements_stock_sous_type ON mouvements_stock(sous_type);
DROP INDEX IF EXISTS idx_mouvements_stock_zone;
CREATE INDEX idx_mouvements_stock_zone ON mouvements_stock(zone);
DROP INDEX IF EXISTS idx_mouvements_stock_motif;
CREATE INDEX idx_mouvements_stock_motif ON mouvements_stock(motif);
-- 🔧 Patch rétroactif pour les bases déjà existantes
-- Ensure all tables have an "actif" column used by frontend filters
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unites' AND column_name = 'actif') THEN
    ALTER TABLE unites ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'factures' AND column_name = 'actif') THEN
    ALTER TABLE factures ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fournisseur_produits' AND column_name = 'actif') THEN
    ALTER TABLE fournisseur_produits ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventaires' AND column_name = 'actif') THEN
    ALTER TABLE inventaires ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requisitions' AND column_name = 'actif') THEN
    ALTER TABLE requisitions ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transferts' AND column_name = 'actif') THEN
    ALTER TABLE transferts ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mouvements_stock' AND column_name = 'actif') THEN
    ALTER TABLE mouvements_stock ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fiche_cout_history' AND column_name = 'actif') THEN
    ALTER TABLE fiche_cout_history ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'access_rights_templates' AND column_name = 'actif') THEN
    ALTER TABLE access_rights_templates ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boissons' AND column_name = 'actif') THEN
    ALTER TABLE boissons ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'actif') THEN
    ALTER TABLE roles ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'utilisateurs' AND column_name = 'actif') THEN
    ALTER TABLE utilisateurs ADD COLUMN actif boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produits' AND column_name = 'actif') THEN
    ALTER TABLE produits ADD COLUMN actif boolean DEFAULT true;
  END IF;
END $$;
-- Création également du profil correspondant dans utilisateurs pour l'auth Supabase
insert into utilisateurs(auth_id, email, mama_id, role, access_rights, actif)
values (
  'a49aeafd-6f60-4f68-a267-d7d27c1a1381',
  'admin@mamastock.com',
  '29c992df-f6b0-47c5-9afa-c965b789aa07',
  'admin',
  '{}'::jsonb,
  true
) on conflict (auth_id) do nothing;

-- ----------------------------------------------------
-- Vues analytiques supplémentaires
-- ----------------------------------------------------
create or replace view vue_stock_actuel as
with mouvements as (
  select zone_destination_id as zone_id, produit_id, quantite, mama_id, actif
    from mouvements_stock
   where zone_destination_id is not null
  union all
  select zone_source_id as zone_id, produit_id, -quantite as quantite, mama_id, actif
    from mouvements_stock
   where zone_source_id is not null
)
select
  mama_id,
  zone_id,
  produit_id,
  sum(quantite) as stock_theorique,
  bool_or(actif) as mouvement_actif
from mouvements
group by mama_id, zone_id, produit_id;
grant select on vue_stock_actuel to authenticated;

create or replace view vue_achats_par_fournisseur as
select
  fp.mama_id,
  fp.fournisseur_id,
  fp.produit_id,
  fp.actif as fournisseur_produit_actif,
  avg(fp.prix_achat) as prix_moyen,
  (
    select prix_achat
      from fournisseur_produits fp2
     where fp2.fournisseur_id = fp.fournisseur_id
       and fp2.produit_id = fp.produit_id
       and fp2.mama_id = fp.mama_id
     order by fp2.date_livraison desc
     limit 1
  ) as dernier_prix,
  count(*) as nb_achats
from fournisseur_produits fp
group by fp.mama_id, fp.fournisseur_id, fp.produit_id, fp.actif;
grant select on vue_achats_par_fournisseur to authenticated;

create or replace view vue_cout_fiche as
select
  f.id as fiche_id,
  f.mama_id,
  f.actif as fiche_actif,
  bool_or(fl.actif) as fiche_ligne_actif,
  bool_or(p.actif) as produit_actif,
  sum(fl.quantite * coalesce(p.pmp, 0)) as cout_total
from fiches f
  left join fiche_lignes fl on fl.fiche_id = f.id
  left join produits p on p.id = fl.produit_id
group by f.id, f.mama_id, f.actif;
grant select on vue_cout_fiche to authenticated;

create or replace view vue_fiches_ventes as
select
  v.fiche_id,
  ft.nom as fiche_nom,
  v.mama_id,
  v.actif as ventes_fiche_actif,
  ft.actif as fiche_technique_actif,
  sum(v.ventes) as total_ventes
from ventes_fiches_carte v
  left join fiches_techniques ft on ft.id = v.fiche_id
group by v.fiche_id, ft.nom, v.mama_id, v.actif, ft.actif;
grant select on vue_fiches_ventes to authenticated;

-- ----------------------------------------------------
-- Ajout conditionnel de la colonne actif pour les tables manquantes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facture_lignes' AND column_name = 'actif'
  ) THEN
    ALTER TABLE facture_lignes ADD COLUMN actif boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fiche_lignes' AND column_name = 'actif'
  ) THEN
    ALTER TABLE fiche_lignes ADD COLUMN actif boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fiche_produits' AND column_name = 'actif'
  ) THEN
    ALTER TABLE fiche_produits ADD COLUMN actif boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventaire_lignes' AND column_name = 'actif'
  ) THEN
    ALTER TABLE inventaire_lignes ADD COLUMN actif boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ventes_boissons' AND column_name = 'actif'
  ) THEN
    ALTER TABLE ventes_boissons ADD COLUMN actif boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ventes_fiches_carte' AND column_name = 'actif'
  ) THEN
    ALTER TABLE ventes_fiches_carte ADD COLUMN actif boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tache_instances' AND column_name = 'actif'
  ) THEN
    ALTER TABLE tache_instances ADD COLUMN actif boolean DEFAULT true;
  END IF;
END $$;

-- Rétablir la vérification des corps de fonctions
set check_function_bodies = on;
-- Fin du script
