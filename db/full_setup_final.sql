-- ========================
-- EXTENSIONS
-- ========================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========================
-- TABLES
-- ========================

-- Table mamas
create table if not exists public.mamas (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete set null,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table roles
create table if not exists public.roles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table permissions
create table if not exists public.permissions (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    code text not null unique,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table role_permissions (liaison)
create table if not exists public.role_permissions (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    role_id uuid references public.roles(id) on delete cascade,
    permission_id uuid references public.permissions(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table utilisateurs
create table if not exists public.utilisateurs (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    auth_id uuid unique,
    nom text,
    email text,
    two_fa_enabled boolean not null default false,
    role_id uuid references public.roles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table familles
create table if not exists public.familles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table sous_familles
create table if not exists public.sous_familles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    famille_id uuid references public.familles(id) on delete cascade,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table unites
create table if not exists public.unites (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table zones_stock
create table if not exists public.zones_stock (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table fournisseurs
create table if not exists public.fournisseurs (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    contact text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table produits
create table if not exists public.produits (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    famille_id uuid references public.familles(id),
    sous_famille_id uuid references public.sous_familles(id),
    unite_id uuid references public.unites(id),
    zone_stock_id uuid references public.zones_stock(id),
    fournisseur_id uuid references public.fournisseurs(id),
    stock_reel numeric(12,2) default 0,
    stock_min numeric(12,2) default 0,
    dernier_prix numeric(12,2),
    pmp numeric(12,2),
    tva numeric(12,2) default 20,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table commandes
create table if not exists public.commandes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    fournisseur_id uuid references public.fournisseurs(id),
    statut text,
    created_at timestamptz not null default now(),
    date_commande date,
    date_livraison_prevue date,
    montant_total numeric(12,2),
    commentaire text,
    updated_at timestamptz not null default now(),
    actif boolean not null default true,
    bl_id uuid references public.bons_livraison(id),
    facture_id uuid references public.factures(id)
);

-- Table bons_livraison
create table if not exists public.bons_livraison (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    fournisseur_id uuid references public.fournisseurs(id),
    numero_bl text,
    date_livraison date,
    created_at timestamptz not null default now(),
    date_reception date,
    commentaire text,
    statut text default 'recu',
    actif boolean not null default true,
    updated_at timestamptz not null default now(),
    commande_id uuid references public.commandes(id) on delete cascade,
    facture_id uuid references public.factures(id)
);

-- Table lignes_bl
create table if not exists public.lignes_bl (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    bl_id uuid references public.bons_livraison(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric(12,2) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table factures
create table if not exists public.factures (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    fournisseur_id uuid references public.fournisseurs(id),
    numero text,
    date_facture date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true,
    total_ht numeric(12,2),
    total_tva numeric(12,2),
    total_ttc numeric(12,2),
    statut text,
    montant_total numeric(12,2),
    bl_id uuid references public.bons_livraison(id),
    lignes_produits jsonb,
    zone_id uuid references public.zones_stock(id),
    justificatif text,
    commentaire text,
    bon_livraison text
);

-- Table facture_lignes
create table if not exists public.facture_lignes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    facture_id uuid references public.factures(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric(12,2) not null,
    prix numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table fournisseur_produits
create table if not exists public.fournisseur_produits (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    fournisseur_id uuid references public.fournisseurs(id),
    prix_achat numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table fiches_techniques
create table if not exists public.fiches_techniques (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    contenu jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table fiche_lignes
create table if not exists public.fiche_lignes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    fiche_id uuid references public.fiches_techniques(id) on delete cascade,
    produit_id uuid references public.produits(id),
    sous_fiche_id uuid references public.fiches_techniques(id),
    quantite numeric(12,2) not null,
    commentaire text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table stock_mouvements
create table if not exists public.stock_mouvements (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    inventaire_id uuid references public.inventaires(id),
    zone_id uuid references public.zones_stock(id),
    zone_source_id uuid references public.zones_stock(id),
    zone_destination_id uuid references public.zones_stock(id),
    auteur_id uuid references public.utilisateurs(id),
    type text not null,
    quantite numeric(12,2) not null,
    reference_id uuid,
    date timestamptz,
    commentaire text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table stocks
create table if not exists public.stocks (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    zone_id uuid references public.zones_stock(id),
    quantite numeric(12,2) not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table inventaires
create table if not exists public.inventaires (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    date_inventaire date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table inventaire_lignes
create table if not exists public.inventaire_lignes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    inventaire_id uuid references public.inventaires(id) on delete cascade,
    produit_id uuid references public.produits(id),
    stock_theorique numeric(12,2) default 0,
    stock_reel numeric(12,2) default 0,
    ecart numeric(12,2) default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table transferts
create table if not exists public.transferts (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric(12,2),
    motif text,
    date_transfert date,
    zone_source_id uuid references public.zones_stock(id),
    zone_dest_id uuid references public.zones_stock(id),
    commentaire text,
    utilisateur_id uuid references public.utilisateurs(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table transfert_lignes
create table if not exists public.transfert_lignes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    transfert_id uuid references public.transferts(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric(12,2) not null,
    commentaire text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table mouvements
create table if not exists public.mouvements (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    inventaire_id uuid references public.inventaires(id),
    quantite numeric(12,2),
    type text,
    date timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table mouvements_centres_cout
create table if not exists public.mouvements_centres_cout (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    mouvement_id uuid references public.mouvements(id) on delete cascade,
    centre_cout_id uuid,
    valeur numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table documents
create table if not exists public.documents (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    titre text,
    url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table notifications
create table if not exists public.notifications (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    utilisateur_id uuid references public.utilisateurs(id) on delete cascade,
    titre text,
    message text,
    lu boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table gadgets
create table if not exists public.gadgets (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text,
    configuration jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table ventes_fiches_carte
create table if not exists public.ventes_fiches_carte (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric(12,2),
    montant numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table ventes_familles
create table if not exists public.ventes_familles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    famille_id uuid references public.familles(id),
    quantite numeric(12,2),
    montant numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table feedback
create table if not exists public.feedback (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    utilisateur_id uuid references public.utilisateurs(id) on delete cascade,
    message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table consentements_utilisateur
create table if not exists public.consentements_utilisateur (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    utilisateur_id uuid references public.utilisateurs(id) on delete cascade,
    type text,
    donne boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);

-- Table periodes_comptables
create table if not exists public.periodes_comptables (
    id uuid primary key default gen_random_uuid(),
    mama_id uuid references public.mamas(id) on delete cascade,
    date_debut date not null,
    date_fin date not null,
    cloturee boolean default false,
    actuelle boolean default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Table taches
create table if not exists public.taches (
    id uuid primary key default gen_random_uuid(),
    mama_id uuid references public.mamas(id) on delete cascade,
    titre text not null,
    description text,
    priorite text check (priorite in ('basse','moyenne','haute')) default 'moyenne',
    statut text check (statut in ('a_faire','en_cours','terminee')) default 'a_faire',
    date_echeance date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Table utilisateurs_taches
create table if not exists public.utilisateurs_taches (
    tache_id uuid references public.taches(id) on delete cascade,
    utilisateur_id uuid references public.utilisateurs(id) on delete cascade,
    primary key (tache_id, utilisateur_id)
);

-- Table tache_instances
create table if not exists public.tache_instances (
    id uuid primary key default gen_random_uuid(),
    mama_id uuid references public.mamas(id) on delete cascade,
    tache_id uuid references public.taches(id) on delete cascade,
    date_echeance date,
    statut text,
    done_by uuid references public.utilisateurs(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    actif boolean default true
);

-- Table planning_previsionnel
create table if not exists public.planning_previsionnel (
    id uuid primary key default gen_random_uuid(),
    mama_id uuid references public.mamas(id) on delete cascade,
    date_prevue date,
    quantite numeric,
    produit_id uuid references public.produits(id),
    created_at timestamptz default now(),
    nom text,
    commentaire text,
    statut text default 'prévu',
    actif boolean default true
);

-- Table planning_lignes
create table if not exists public.planning_lignes (
    id uuid primary key default gen_random_uuid(),
    planning_id uuid references public.planning_previsionnel(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric,
    observation text,
    mama_id uuid references public.mamas(id),
    actif boolean default true,
    created_at timestamptz default now()
);

-- ========================
-- COLONNES ADDITIONNELLES
-- ========================

alter table if exists public.produits
  add column if not exists zone_stock_id uuid references public.zones_stock(id) on delete set null,
  add column if not exists tva numeric(12,2);

alter table if exists public.factures
  add column if not exists justificatif text,
  add column if not exists commentaire text,
  add column if not exists bon_livraison text,
  add column if not exists periode_id uuid references public.periodes_comptables(id);

alter table if exists public.inventaires
  add column if not exists periode_id uuid references public.periodes_comptables(id);

alter table if exists public.stock_mouvements
  add column if not exists periode_id uuid references public.periodes_comptables(id);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'familles' and column_name = 'parent_id'
  ) then
    alter table public.familles rename column parent_id to famille_parent_id;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'familles' and column_name = 'famille_parent_id'
  ) then
    alter table public.familles add column famille_parent_id uuid references public.familles(id) on delete set null;
  end if;
end$$;
-- ========================
-- FOREIGN KEYS
-- All foreign keys are defined in table creation statements.
-- ========================
-- INDEXES
create index if not exists idx_mamas_mama_id on public.mamas(mama_id);
create index if not exists idx_roles_mama_id on public.roles(mama_id);
create index if not exists idx_permissions_mama_id on public.permissions(mama_id);
create unique index if not exists ux_role_permissions on public.role_permissions(role_id, permission_id);
create index if not exists idx_role_permissions_mama_id on public.role_permissions(mama_id);
create index if not exists idx_utilisateurs_mama_id on public.utilisateurs(mama_id);
create index if not exists idx_familles_mama_id on public.familles(mama_id);
create index if not exists idx_sous_familles_mama_id on public.sous_familles(mama_id);
create index if not exists idx_sous_familles_famille_id on public.sous_familles(famille_id);
create index if not exists idx_unites_mama_id on public.unites(mama_id);
create index if not exists idx_zones_stock_mama_id on public.zones_stock(mama_id);
create index if not exists idx_fournisseurs_mama_id on public.fournisseurs(mama_id);
create index if not exists idx_produits_mama_id on public.produits(mama_id);
create index if not exists idx_produits_famille_id on public.produits(famille_id);
create index if not exists idx_produits_zone_stock_id on public.produits(zone_stock_id);
create index if not exists idx_commandes_mama_id on public.commandes(mama_id);
create index if not exists idx_commandes_statut on public.commandes(statut);
create index if not exists idx_bons_livraison_mama_id on public.bons_livraison(mama_id);
create index if not exists idx_bons_livraison_statut on public.bons_livraison(statut);
create index if not exists idx_lignes_bl_mama_id on public.lignes_bl(mama_id);
create index if not exists idx_lignes_bl_bl_id on public.lignes_bl(bl_id);
create index if not exists idx_factures_mama_id on public.factures(mama_id);
create index if not exists idx_facture_lignes_mama_id on public.facture_lignes(mama_id);
create index if not exists idx_facture_lignes_facture_id on public.facture_lignes(facture_id);
create index if not exists idx_fiches_techniques_mama_id on public.fiches_techniques(mama_id);
create index if not exists idx_stock_mouvements_mama_id on public.stock_mouvements(mama_id);
create index if not exists idx_stock_mouvements_produit_id on public.stock_mouvements(produit_id);
create index if not exists idx_stock_mouvements_date on public.stock_mouvements(date);
create index if not exists idx_stocks_mama_id on public.stocks(mama_id);
create index if not exists idx_stocks_produit_id on public.stocks(produit_id);
create index if not exists idx_stocks_zone_id on public.stocks(zone_id);
create index if not exists idx_inventaires_mama_id on public.inventaires(mama_id);
create index if not exists idx_inventaire_lignes_mama_id on public.inventaire_lignes(mama_id);
create index if not exists idx_inventaire_lignes_inventaire_id on public.inventaire_lignes(inventaire_id);
create index if not exists idx_documents_mama_id on public.documents(mama_id);
create index if not exists idx_notifications_mama_id on public.notifications(mama_id);
create index if not exists idx_notifications_utilisateur_id on public.notifications(utilisateur_id);
create index if not exists idx_gadgets_mama_id on public.gadgets(mama_id);
create index if not exists idx_ventes_fiches_carte_mama_id on public.ventes_fiches_carte(mama_id);
create index if not exists idx_ventes_familles_mama_id on public.ventes_familles(mama_id);
create index if not exists idx_feedback_mama_id on public.feedback(mama_id);
create index if not exists idx_consentements_utilisateur_mama_id on public.consentements_utilisateur(mama_id);
create index if not exists idx_periodes_comptables_mama_id on public.periodes_comptables(mama_id);
create unique index if not exists idx_periodes_comptables_actuelle on public.periodes_comptables(mama_id) where actuelle;
create index if not exists idx_taches_mama_id on public.taches(mama_id);
create index if not exists idx_taches_statut on public.taches(statut);
create index if not exists idx_taches_priorite on public.taches(priorite);
create index if not exists idx_utilisateurs_taches_tache on public.utilisateurs_taches(tache_id);
create index if not exists idx_utilisateurs_taches_utilisateur on public.utilisateurs_taches(utilisateur_id);
create index if not exists idx_tache_instances_mama_id on public.tache_instances(mama_id);
create index if not exists idx_planning_previsionnel_mama_id on public.planning_previsionnel(mama_id);
create index if not exists idx_planning_lignes_mama_id on public.planning_lignes(mama_id);
create index if not exists idx_factures_periode_id on public.factures(periode_id);
create index if not exists idx_inventaires_periode_id on public.inventaires(periode_id);
create index if not exists idx_stock_mouvements_periode_id on public.stock_mouvements(periode_id);
create index if not exists idx_fournisseur_produits_mama_id on public.fournisseur_produits(mama_id);
create index if not exists idx_fournisseur_produits_produit_id on public.fournisseur_produits(produit_id);
create index if not exists idx_fournisseur_produits_fournisseur_id on public.fournisseur_produits(fournisseur_id);
create index if not exists idx_fournisseur_produits_produit_date on public.fournisseur_produits(produit_id, created_at desc);
create index if not exists idx_fiche_lignes_mama_id on public.fiche_lignes(mama_id);
create index if not exists idx_fiche_lignes_fiche_id on public.fiche_lignes(fiche_id);
create index if not exists idx_fiche_lignes_produit_id on public.fiche_lignes(produit_id);
create index if not exists idx_fiche_lignes_sous_fiche_id on public.fiche_lignes(sous_fiche_id);
create index if not exists idx_transferts_mama_id on public.transferts(mama_id);
create index if not exists idx_transferts_produit_id on public.transferts(produit_id);
create index if not exists idx_transferts_zone_source_id on public.transferts(zone_source_id);
create index if not exists idx_transferts_zone_dest_id on public.transferts(zone_dest_id);
create index if not exists idx_transfert_lignes_transfert_id on public.transfert_lignes(transfert_id);
create index if not exists idx_transfert_lignes_produit_id on public.transfert_lignes(produit_id);
create index if not exists idx_mouvements_mama_id on public.mouvements(mama_id);
create index if not exists idx_mouvements_produit_id on public.mouvements(produit_id);
create index if not exists idx_mouvements_date on public.mouvements(date);
create index if not exists idx_mouvements_centres_cout_mama_id on public.mouvements_centres_cout(mama_id);
create index if not exists idx_mouvements_centres_cout_mouvement_id on public.mouvements_centres_cout(mouvement_id);
create index if not exists idx_mouvements_centres_cout_centre_cout_id on public.mouvements_centres_cout(centre_cout_id);
-- ========================
-- FUNCTIONS
-- ========================

create or replace function public.current_user_mama_id()
returns uuid
language sql stable as $$
  select u.mama_id from public.utilisateurs u where u.auth_id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql stable as $$
  select r.nom from public.roles r
  join public.utilisateurs u on u.role_id = r.id
  where u.auth_id = auth.uid();
$$;

create or replace function public.enable_two_fa(code text)
returns boolean
language plpgsql security definer as $$
begin
  update public.utilisateurs
     set two_fa_enabled = true,
         updated_at = now()
   where auth_id = auth.uid();
  return true;
end;
$$;

create or replace function public.disable_two_fa()
returns boolean
language plpgsql security definer as $$
begin
  update public.utilisateurs
     set two_fa_enabled = false,
         updated_at = now()
   where auth_id = auth.uid();
  return true;
end;
$$;

create or replace function public.fn_calc_budgets(
  mama_id_param uuid,
  periode_param text
)
returns table(budget numeric, reel numeric)
language sql stable as $$
  select 0::numeric as budget, 0::numeric as reel;
$$;

create or replace function public.stats_rotation_produit(
  mama_id_param uuid,
  produit_id_param uuid
)
returns jsonb
language sql stable as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'mois', to_char(date_trunc('month', sm.date), 'YYYY-MM'),
        'quantite', sum(sm.quantite)
      ) order by to_char(date_trunc('month', sm.date), 'YYYY-MM')
    ),
    '[]'::jsonb
  )
  from public.stock_mouvements sm
  where sm.mama_id = mama_id_param
    and sm.produit_id = produit_id_param
    and sm.type in ('sortie','sortie_fiche','perte','don','sortie_transfert');
$$;

create or replace function public.top_produits(
  mama_id_param uuid,
  debut_param date default null,
  fin_param date default null,
  limit_param integer default 5
)
returns table(produit_id uuid, nom text, quantite numeric)
language sql stable as $$
  select p.id, p.nom,
         coalesce(sum(
           case
             when sm.type in ('sortie','sortie_fiche','perte','don','sortie_transfert') then sm.quantite
             else 0 end
         ),0) as quantite
    from public.produits p
    left join public.stock_mouvements sm
      on sm.produit_id = p.id
     and sm.mama_id = p.mama_id
     and (debut_param is null or sm.date >= debut_param)
     and (fin_param is null or sm.date <= fin_param)
   where p.mama_id = mama_id_param
   group by p.id, p.nom
   order by quantite desc
   limit limit_param;
$$;

create or replace function public.consolidated_stats()
returns table(total_produits bigint, total_fournisseurs bigint, total_alertes bigint)
language sql stable as $$
  select
    (select count(*) from public.produits where mama_id = public.current_user_mama_id()),
    (select count(*) from public.fournisseurs where mama_id = public.current_user_mama_id()),
    (select count(*) from public.notifications where mama_id = public.current_user_mama_id() and lu is false)
$$;

create or replace function public.periode_actuelle(mid uuid)
returns table(
  id uuid,
  mama_id uuid,
  date_debut date,
  date_fin date,
  cloturee boolean,
  actuelle boolean
)
language sql stable as $$
  select * from public.periodes_comptables
  where mama_id = mid and actuelle = true
  limit 1;
$$;

create or replace function public.fn_sync_auth_user()
returns trigger
language plpgsql security definer as $$
begin
  insert into public.utilisateurs (auth_id, email)
    values (new.id, new.email)
    on conflict (auth_id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.apply_stock_from_achat(
  p_achat_id uuid,
  p_table text,
  p_mama_id uuid
)
returns void
language plpgsql as $$
declare
  r record;
  v_stock numeric;
  v_pmp numeric;
begin
  delete from public.stock_mouvements
    where type = 'entree_achat' and reference_id = p_achat_id;
  if p_table = 'factures' then
    for r in
      select fl.produit_id, fl.quantite, fl.prix
      from public.facture_lignes fl
      join public.factures f on f.id = fl.facture_id
      where f.id = p_achat_id and f.mama_id = p_mama_id and fl.actif is true
    loop
      insert into public.stock_mouvements(mama_id, date, type, quantite, produit_id, reference_id)
        values (p_mama_id, now(), 'entree_achat', r.quantite, r.produit_id, p_achat_id);
      select coalesce(stock_reel,0), coalesce(pmp,0) into v_stock, v_pmp
        from public.produits where id = r.produit_id and mama_id = p_mama_id;
      update public.produits
         set dernier_prix = r.prix,
             pmp = case when v_stock + r.quantite = 0 then r.prix
                        else ((v_stock * v_pmp) + (r.quantite * r.prix)) / (v_stock + r.quantite) end
       where id = r.produit_id and mama_id = p_mama_id;
    end loop;
  elsif p_table = 'bons_livraison' then
    for r in
      select l.produit_id, l.quantite_recue as quantite, l.prix_achat as prix
      from public.lignes_bl l
      join public.bons_livraison b on b.id = l.bl_id
      where b.id = p_achat_id and b.mama_id = p_mama_id
    loop
      insert into public.stock_mouvements(mama_id, date, type, quantite, produit_id, reference_id)
        values (p_mama_id, now(), 'entree_achat', r.quantite, r.produit_id, p_achat_id);
      select coalesce(stock_reel,0), coalesce(pmp,0) into v_stock, v_pmp
        from public.produits where id = r.produit_id and mama_id = p_mama_id;
      update public.produits
         set dernier_prix = r.prix,
             pmp = case when v_stock + r.quantite = 0 then r.prix
                        else ((v_stock * v_pmp) + (r.quantite * r.prix)) / (v_stock + r.quantite) end
       where id = r.produit_id and mama_id = p_mama_id;
    end loop;
  end if;
end;
$$;

create or replace function public.insert_stock_from_transfert_ligne(p_ligne_id uuid)
returns void
language plpgsql as $$
declare
  l record;
begin
  select tl.*, t.mama_id, t.zone_source_id, t.zone_dest_id, t.utilisateur_id, t.date_transfert, coalesce(t.commentaire, tl.commentaire) as commentaire
    into l
    from public.transfert_lignes tl
    join public.transferts t on t.id = tl.transfert_id
    where tl.id = p_ligne_id;
  if l.id is null then return; end if;
  insert into public.stock_mouvements(mama_id, produit_id, type, quantite, date, zone_id, zone_source_id, zone_destination_id, auteur_id, commentaire)
    values (l.mama_id, l.produit_id, 'sortie_transfert', l.quantite, l.date_transfert, l.zone_source_id, l.zone_source_id, l.zone_dest_id, l.utilisateur_id, l.commentaire);
  insert into public.stock_mouvements(mama_id, produit_id, type, quantite, date, zone_id, zone_source_id, zone_destination_id, auteur_id, commentaire)
    values (l.mama_id, l.produit_id, 'entree_transfert', l.quantite, l.date_transfert, l.zone_dest_id, l.zone_source_id, l.zone_dest_id, l.utilisateur_id, l.commentaire);
end;
$$;

create or replace function public.set_requisition_stock_theorique(p_inventaire_id uuid)
returns void
language plpgsql as $$
begin
  update public.inventaire_lignes il
     set stock_theorique = coalesce((
       select sum(case
         when type in ('entree_achat','entree','entree_transfert') then quantite
         when type in ('ajustement_inventaire','ajustement') then quantite
         else -quantite end)
       from public.stock_mouvements sm
       where sm.produit_id = il.produit_id and sm.mama_id = il.mama_id
     ),0)
  where il.inventaire_id = p_inventaire_id;
end;
$$;

create or replace function public.apply_stock_from_fiche(p_vente_id uuid)
returns void
language plpgsql as $$
declare
  v record;
  l record;
begin
  select * into v from public.ventes_fiches_carte where id = p_vente_id;
  if v.id is null then return; end if;
  delete from public.stock_mouvements where type = 'sortie_fiche' and reference_id = p_vente_id;
  for l in select produit_id, quantite from public.fiche_lignes where fiche_id = v.fiche_id loop
    insert into public.stock_mouvements(mama_id, produit_id, type, quantite, reference_id)
    values (v.mama_id, l.produit_id, 'sortie_fiche', l.quantite * v.ventes, p_vente_id);
  end loop;
end;
$$;

create or replace function public.apply_inventaire_line(p_ligne_id uuid)
returns void
language plpgsql as $$
declare
  l record;
  v_ecart numeric;
begin
  select * into l from public.inventaire_lignes where id = p_ligne_id;
  if l.id is null then return; end if;
  v_ecart := coalesce(l.stock_reel,0) - coalesce(l.stock_theorique,0);
  update public.inventaire_lignes set ecart = v_ecart where id = p_ligne_id;
  delete from public.stock_mouvements where type = 'ajustement_inventaire' and reference_id = p_ligne_id;
  if v_ecart <> 0 then
    insert into public.stock_mouvements(mama_id, produit_id, type, quantite, reference_id)
    values (l.mama_id, l.produit_id, 'ajustement_inventaire', v_ecart, p_ligne_id);
  end if;
end;
$$;

-- ========================
-- Additional trigger functions
-- ========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_delete_if_linked()
returns trigger
language plpgsql as $$
begin
  raise exception 'Suppression interdite : enregistrement lié';
end;
$$;

create or replace function public.trg_apply_stock_from_achat()
returns trigger
language plpgsql as $$
begin
  perform public.apply_stock_from_achat(
    coalesce(new.facture_id, old.facture_id),
    'factures',
    coalesce(new.mama_id, old.mama_id)
  );
  return new;
end;
$$;

create or replace function public.trg_insert_stock_from_transfert_ligne()
returns trigger
language plpgsql as $$
begin
  perform public.insert_stock_from_transfert_ligne(new.id);
  return new;
end;
$$;

create or replace function public.trg_set_requisition_stock_theorique()
returns trigger
language plpgsql as $$
begin
  perform public.set_requisition_stock_theorique(new.inventaire_id);
  return new;
end;
$$;

create or replace function public.trg_apply_stock_facture()
returns trigger
language plpgsql as $$
begin
  perform public.apply_stock_from_achat(new.id, 'factures', new.mama_id);
  return new;
end;
$$;

create or replace function public.trg_apply_stock_bl()
returns trigger
language plpgsql as $$
begin
  perform public.apply_stock_from_achat(new.id, 'bons_livraison', new.mama_id);
  return new;
end;
$$;

create or replace function public.trg_apply_stock_from_fiche()
returns trigger
language plpgsql as $$
begin
  perform public.apply_stock_from_fiche(coalesce(new.id, old.id));
  return new;
end;
$$;

create or replace function public.trg_apply_inventaire_line()
returns trigger
language plpgsql as $$
begin
  perform public.apply_inventaire_line(coalesce(new.id, old.id));
  return new;
end;
$$;

-- ========================
-- TRIGGERS
-- ========================

-- Synchronisation avec auth.users
drop trigger if exists trg_sync_auth_user on auth.users;
create trigger trg_sync_auth_user
  after insert or update on auth.users
  for each row execute function public.fn_sync_auth_user();

-- updated_at triggers
do $$
declare t text;
begin
    foreach t in array array[
      'mamas','roles','permissions','role_permissions','utilisateurs','familles','sous_familles','unites','zones_stock','fournisseurs','produits','commandes','bons_livraison','lignes_bl','factures','facture_lignes','fiches_techniques','stock_mouvements','stocks','inventaires','inventaire_lignes','documents','notifications','gadgets','ventes_fiches_carte','ventes_familles','feedback','consentements_utilisateur','periodes_comptables','taches','fournisseur_produits','fiche_lignes','transferts','transfert_lignes','mouvements','mouvements_centres_cout','tache_instances'
    ]
  loop
    execute format('drop trigger if exists set_timestamp on public.%I;', t);
    execute format('create trigger set_timestamp before update on public.%I for each row execute function public.trigger_set_timestamp();', t);
  end loop;
end$$;

drop trigger if exists trg_apply_stock_from_achat on public.facture_lignes;
create trigger trg_apply_stock_from_achat
  after insert or update or delete on public.facture_lignes
  for each row execute function public.trg_apply_stock_from_achat();

drop trigger if exists trg_apply_stock_facture on public.factures;
create trigger trg_apply_stock_facture
  after insert on public.factures
  for each row execute function public.trg_apply_stock_facture();

drop trigger if exists trg_apply_stock_bl on public.bons_livraison;
create trigger trg_apply_stock_bl
  after insert on public.bons_livraison
  for each row execute function public.trg_apply_stock_bl();

drop trigger if exists trg_insert_stock_from_transfert_ligne on public.transfert_lignes;
create trigger trg_insert_stock_from_transfert_ligne
  after insert on public.transfert_lignes
  for each row execute function public.trg_insert_stock_from_transfert_ligne();

drop trigger if exists trg_apply_stock_from_fiche on public.ventes_fiches_carte;
create trigger trg_apply_stock_from_fiche
  after insert or update or delete on public.ventes_fiches_carte
  for each row execute function public.trg_apply_stock_from_fiche();

drop trigger if exists trg_apply_inventaire_line on public.inventaire_lignes;
create trigger trg_apply_inventaire_line
  after insert or update or delete on public.inventaire_lignes
  for each row execute function public.trg_apply_inventaire_line();

drop trigger if exists trg_set_requisition_stock_theorique on public.inventaire_lignes;
create trigger trg_set_requisition_stock_theorique
  after insert or update on public.inventaire_lignes
  for each row execute function public.trg_set_requisition_stock_theorique();

-- Exemple de protection sur produits
drop trigger if exists trg_prevent_delete_produits on public.produits;
create trigger trg_prevent_delete_produits
  before delete on public.produits
  for each row execute function public.prevent_delete_if_linked();

-- ========================
-- VIEWS
-- ========================

create or replace view public.v_produits_dernier_prix as
select p.id as produit_id, p.mama_id,
       (select fl.prix from public.facture_lignes fl
         join public.factures f on fl.facture_id = f.id
         where fl.produit_id = p.id
         order by f.created_at desc
         limit 1) as dernier_prix
from public.produits p;

create or replace view public.v_evolution_achats as
select mama_id,
       date_trunc('month', created_at) as mois,
       sum(quantite) as quantite
from public.stock_mouvements
where type = 'entree_achat'
group by mama_id, date_trunc('month', created_at);

create or replace view public.v_ventes_par_famille as
select vf.mama_id, f.nom as famille,
       sum(vf.quantite) as quantite,
       sum(vf.montant) as montant
from public.ventes_familles vf
join public.familles f on vf.famille_id = f.id
group by vf.mama_id, f.nom;

create or replace view public.v_ecarts_inventaire as
select il.mama_id, i.id as inventaire_id, p.nom as produit,
       il.stock_theorique, il.stock_reel, il.ecart
from public.inventaire_lignes il
join public.inventaires i on il.inventaire_id = i.id
join public.produits p on il.produit_id = p.id;

create or replace view public.v_notifications_non_lues as
select * from public.notifications where lu = false;

create or replace view public.v_stock_disponible as
select p.mama_id, p.id as produit_id,
       coalesce(sum(case
         when sm.type in ('entree_achat','entree_transfert','entree') then sm.quantite
         when sm.type in ('ajustement_inventaire','ajustement') then sm.quantite
         else -sm.quantite end),0) as stock
from public.produits p
left join public.stock_mouvements sm on sm.produit_id = p.id and sm.mama_id = p.mama_id
group by p.mama_id, p.id;

create or replace view public.v_stocks as
select * from public.v_stock_disponible;

create or replace view public.v_consommation_cumulee as
select p.mama_id, p.id as produit_id,
       coalesce(sum(case
         when sm.type in ('sortie_fiche','ajustement_inventaire','perte','don','sortie_transfert') then sm.quantite
         else 0 end),0) as consommation
from public.produits p
left join public.stock_mouvements sm on sm.produit_id = p.id and sm.mama_id = p.mama_id
group by p.mama_id, p.id;

create or replace view public.v_requisitions as
select * from public.v_stock_disponible;

create or replace view public.v_taches_assignees as
select
  t.id,
  t.mama_id,
  t.titre,
  t.description,
  t.priorite,
  t.statut,
  t.date_echeance,
  t.created_at,
  t.updated_at,
  ut.utilisateur_id,
  u.nom as utilisateur_nom,
  r.nom as utilisateur_role
from public.taches t
left join public.utilisateurs_taches ut on ut.tache_id = t.id
left join public.utilisateurs u on u.id = ut.utilisateur_id
left join public.roles r on r.id = u.role_id;

create or replace view public.v_achats_mensuels as
select f.mama_id,
       date_trunc('month', f.date_facture) as mois,
       sum(fl.quantite * fl.prix) as montant
from public.factures f
join public.facture_lignes fl on fl.facture_id = f.id
group by f.mama_id, date_trunc('month', f.date_facture);

create or replace view public.v_pmp as
select p.mama_id,
       p.id as produit_id,
       p.pmp
from public.produits p;

create or replace view public.v_cost_center_month as
select mcc.mama_id,
       mcc.centre_cout_id as cost_center_id,
       date_trunc('month', m.date) as mois,
       sum(mcc.valeur) as valeur
from public.mouvements m
join public.mouvements_centres_cout mcc on mcc.mouvement_id = m.id
group by mcc.mama_id, mcc.centre_cout_id, date_trunc('month', m.date);

create or replace view public.v_cost_center_monthly as
select mama_id, mois, sum(valeur) as total
from public.v_cost_center_month
group by mama_id, mois;

create or replace view public.v_analytique_stock as
select m.mama_id,
       m.date as date,
       p.famille,
       mcc.centre_cout_id as cost_center_id,
       m.produit_id,
       mcc.valeur
from public.mouvements m
left join public.mouvements_centres_cout mcc on mcc.mouvement_id = m.id
left join public.produits p on p.id = m.produit_id;

create or replace view public.v_fournisseurs_inactifs as
select id, mama_id, nom, contact, actif, created_at
from public.fournisseurs
where actif is false;

create or replace view public.v_tendance_prix_produit as
select fl.produit_id,
       date_trunc('month', f.date_facture) as mois,
       avg(fl.prix) as prix_moyen
from public.facture_lignes fl
join public.factures f on f.id = fl.facture_id
where fl.actif is true and f.actif is true
group by fl.produit_id, date_trunc('month', f.date_facture);

create or replace view public.v_products_last_price as
select sp.produit_id,
       p.nom as produit_nom,
       p.famille_id as famille,
       p.unite_id as unite,
       sp.fournisseur_id,
       s.nom as fournisseur_nom,
       sp.prix_achat as dernier_prix,
       sp.created_at,
       p.mama_id
from public.fournisseur_produits sp
join public.produits p on sp.produit_id = p.id
join public.fournisseurs s on sp.fournisseur_id = s.id
where sp.created_at = (
  select max(sp2.created_at)
  from public.fournisseur_produits sp2
  where sp2.produit_id = sp.produit_id
    and sp2.fournisseur_id = sp.fournisseur_id
);

create or replace view public.v_transferts_historique as
select t.id,
       t.mama_id,
       t.produit_id,
       p.nom as produit_nom,
       t.quantite,
       t.motif,
       t.date_transfert,
       zs.nom as zone_depart,
       zd.nom as zone_arrivee,
       t.commentaire
from public.transferts t
left join public.produits p on p.id = t.produit_id
left join public.zones_stock zs on zs.id = t.zone_source_id
left join public.zones_stock zd on zd.id = t.zone_dest_id;

-- ========================
-- RLS
-- ========================
do $$
declare t text;
begin
  foreach t in array array[
    'mamas','roles','permissions','role_permissions','utilisateurs','familles','sous_familles','unites','zones_stock','fournisseurs','produits','commandes','bons_livraison','lignes_bl','factures','facture_lignes','fiches_techniques','stock_mouvements','stocks','inventaires','inventaire_lignes','documents','notifications','gadgets','ventes_fiches_carte','ventes_familles','feedback','consentements_utilisateur','periodes_comptables','taches','tache_instances','planning_previsionnel','planning_lignes','fournisseur_produits','fiche_lignes','transferts','transfert_lignes','mouvements','mouvements_centres_cout'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists mama_policy on public.%I;', t);
    execute format('create policy mama_policy on public.%I using (mama_id = public.current_user_mama_id()) with check (mama_id = public.current_user_mama_id());', t);
  end loop;
end$$;

alter table public.utilisateurs_taches enable row level security;
drop policy if exists utilisateurs_taches_policy on public.utilisateurs_taches;
create policy utilisateurs_taches_policy on public.utilisateurs_taches
  using (
    exists (
      select 1 from public.taches t
      where t.id = tache_id and t.mama_id = public.current_user_mama_id()
    )
  )
  with check (
    exists (
      select 1 from public.taches t
      where t.id = tache_id and t.mama_id = public.current_user_mama_id()
    )
  );

-- ========================
-- GRANTS
-- ========================
do $$
declare t text;
begin
  foreach t in array array[
    'mamas','roles','permissions','role_permissions','utilisateurs','familles','sous_familles','unites','zones_stock','fournisseurs','produits','commandes','bons_livraison','lignes_bl','factures','facture_lignes','fiches_techniques','stock_mouvements','stocks','inventaires','inventaire_lignes','documents','notifications','gadgets','ventes_fiches_carte','ventes_familles','feedback','consentements_utilisateur','periodes_comptables','taches','tache_instances','planning_previsionnel','planning_lignes','fournisseur_produits','fiche_lignes','transferts','transfert_lignes','mouvements','mouvements_centres_cout'
  ]
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end$$;

grant select, insert, update, delete on public.utilisateurs_taches to authenticated;

-- ========================
-- FIN DU SCRIPT
-- ========================
