-- SCRIPT COMPATIBLE SUPABASE — AUCUNE OPÉRATION INTERDITE — PRÊT À L’IMPORT
-- full_setup.sql - Schéma complet MamaStock pour Supabase
-- Script autonome combinant initialisation, RLS et correctifs
-- ------------------

-- Création du schéma public si nécessaire (jamais supprimé)
create schema if not exists public;
-- Autoriser l'accès aux objets du schéma
grant usage on schema public to authenticated;
grant usage on schema public to anon;
grant all privileges on schema public to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
-- S'assurer que les fonctions d'extension sont visibles
set search_path = public, extensions;
-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

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


-- ------------------
-- Tables de base
-- ------------------
create table if not exists mamas (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    logo text,
    contact text,
    created_at timestamptz default now()
);

create table if not exists roles (
    id uuid primary key default uuid_generate_v4(),
    nom text not null unique,
    description text
);

create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    email text not null unique,
    password text,
    role_id uuid references roles(id),
    access_rights jsonb default '[]',
    actif boolean default true,
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
    actif boolean default true,
    created_at timestamptz default now()
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

create index if not exists idx_utilisateurs_auth_id on utilisateurs(auth_id);
create index if not exists idx_utilisateurs_mama_id on utilisateurs(mama_id);

-- Helper functions used in RLS policies
create or replace function current_user_mama_id()
returns uuid
language sql
stable
security definer
as $$
  select coalesce(
    (select mama_id from utilisateurs where auth_id = auth.uid() limit 1),
    (select mama_id from users where id = auth.uid() limit 1)
  );
$$;

create or replace function current_user_role()
returns text
language sql
stable
security definer
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
    unique(mama_id, nom)
);

create table if not exists unites (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    abbr text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(mama_id, nom)
);

-- Fournisseurs
create table if not exists fournisseurs (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    ville text,
    tel text,
    contact text,
    actif boolean default true,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(mama_id, nom)
);

-- Produits
create table if not exists produits (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    famille_id uuid references familles(id) on delete set null,
    unite_id uuid references unites(id) on delete set null,
    pmp numeric default 0,
    stock_theorique numeric default 0,
    stock_reel numeric default 0,
    stock_min numeric default 0,
    actif boolean default true,
    code text,
    allergenes text,
    image text,
    main_supplier_id uuid references fournisseurs(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(mama_id, nom)
);

-- Historique des prix fournisseurs
create table if not exists fournisseur_produits (
    id uuid primary key default uuid_generate_v4(),
    produit_id uuid references produits(id) on delete cascade,
    fournisseur_id uuid references fournisseurs(id) on delete cascade,
    prix_achat numeric not null,
    date_livraison date default current_date,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(produit_id, fournisseur_id, date_livraison)
);

-- Factures
create table if not exists factures (
    id uuid primary key default uuid_generate_v4(),
    reference text,
    date date not null,
    fournisseur_id uuid references fournisseurs(id) on delete set null,
    montant numeric,
    total_ht numeric default 0,
    total_tva numeric default 0,
    total_ttc numeric default 0,
    statut text,
    justificatif text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
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
    created_at timestamptz default now()
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
    actif boolean default true,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(mama_id, nom)
);

create table if not exists fiche_lignes (
    id uuid primary key default uuid_generate_v4(),
    fiche_id uuid references fiches(id) on delete cascade,
    produit_id uuid references produits(id) on delete set null,
    quantite numeric not null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

create table if not exists fiche_cout_history (
    id uuid primary key default uuid_generate_v4(),
    fiche_id uuid references fiches(id) on delete cascade,
    date date default current_date,
    cout_total numeric,
    cout_par_portion numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Fiches techniques avancees
create table if not exists fiches_techniques (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    famille text,
    portions integer,
    cout_total numeric,
    cout_portion numeric,
    actif boolean default true,
    carte_actuelle boolean default false,
    type_carte text,
    sous_type_carte text,
    prix_vente numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(mama_id, nom)
);
-- Inventaires et mouvements
create table if not exists inventaires (
    id uuid primary key default uuid_generate_v4(),
    date date not null,
    reference text,
    cloture boolean default false,
    zone text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

create table if not exists inventaire_lignes (
    id uuid primary key default uuid_generate_v4(),
    inventaire_id uuid references inventaires(id) on delete cascade,
    produit_id uuid references produits(id) on delete set null,
    quantite numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Zones de stock
create table if not exists zones_stock (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    mama_id uuid not null references mamas(id),
    actif boolean default true,
    created_at timestamptz default now(),
    unique(mama_id, nom)
);

-- Inventaire zones
create table if not exists inventaire_zones (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(mama_id, nom)
);

create table if not exists mouvements_stock (
    id uuid primary key default uuid_generate_v4(),
    produit_id uuid references produits(id) on delete set null,
    quantite numeric not null,
    type text check (type in ('entree','sortie','correction','transfert')),
    zone_source_id uuid references zones_stock(id),
    zone_destination_id uuid references zones_stock(id),
    date date default current_date,
    commentaire text,
    auteur_id uuid references utilisateurs(id),
    inventaire_id uuid references inventaires(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
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
    date date default current_date,
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
    actif boolean default true,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Menus
create table if not exists menus (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    date date,
    actif boolean default true,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(mama_id, nom, date)
);

create table if not exists menu_fiches (
    id uuid primary key default uuid_generate_v4(),
    menu_id uuid references menus(id) on delete cascade,
    fiche_id uuid references fiches(id) on delete cascade,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(menu_id, fiche_id)
);

-- Réquisitions
create table if not exists requisitions (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id),
    produit_id uuid references produits(id),
    zone_id uuid references zones_stock(id),
    date date default current_date,
    quantite numeric not null,
    type text,
    commentaire text,
    auteur_id uuid references utilisateurs(id),
    created_at timestamptz default now()
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
    created_at timestamptz default now()
);


-- Ventes de boissons
create table if not exists ventes_boissons (
    id uuid primary key default uuid_generate_v4(),
    boisson_id uuid references fiches(id) on delete set null,
    quantite numeric,
    date_vente date default current_date,
    created_by uuid references users(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
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

-- Harmonisation des anciens noms de colonnes
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
    ALTER TABLE facture_lignes RENAME COLUMN product_id TO produit_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='facture_lignes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE facture_lignes ADD COLUMN produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiche_lignes' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiche_lignes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE fiche_lignes RENAME COLUMN product_id TO produit_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiche_lignes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE fiche_lignes ADD COLUMN produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaire_lignes' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaire_lignes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE inventaire_lignes RENAME COLUMN product_id TO produit_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaire_lignes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE inventaire_lignes ADD COLUMN produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='produit_id'
  ) THEN
    ALTER TABLE mouvements_stock RENAME COLUMN product_id TO produit_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='produit_id'
  ) THEN
    ALTER TABLE mouvements_stock ADD COLUMN produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='produit_id'
  ) THEN
    ALTER TABLE requisitions RENAME COLUMN product_id TO produit_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='requisitions' AND column_name='produit_id'
  ) THEN
    ALTER TABLE requisitions ADD COLUMN produit_id uuid references produits(id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='transferts' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='transferts' AND column_name='produit_id'
  ) THEN
    ALTER TABLE transferts RENAME COLUMN product_id TO produit_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='transferts' AND column_name='produit_id'
  ) THEN
    ALTER TABLE transferts ADD COLUMN produit_id uuid references produits(id) on delete set null;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='pertes' AND column_name='product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='pertes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE pertes RENAME COLUMN product_id TO produit_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='pertes' AND column_name='produit_id'
  ) THEN
    ALTER TABLE pertes ADD COLUMN produit_id uuid references produits(id);
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
      ALTER TABLE promotion_produits RENAME COLUMN product_id TO produit_id;
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='promotion_produits' AND column_name='produit_id'
    ) THEN
      ALTER TABLE promotion_produits ADD COLUMN produit_id uuid references produits(id) on delete cascade;
    END IF;
  END IF;
END $$;

-- Indexes
create index if not exists idx_users_mama on users(mama_id);
create index if not exists idx_users_role on users(role_id);
create index if not exists idx_users_actif on users(actif);
create index if not exists idx_fournisseurs_mama on fournisseurs(mama_id);
create index if not exists idx_fournisseurs_nom on fournisseurs(nom);
create index if not exists idx_fournisseurs_ville on fournisseurs(ville);
create index if not exists idx_fournisseurs_actif on fournisseurs(actif);
create index if not exists idx_produits_mama on produits(mama_id);
create index if not exists idx_produits_nom on produits(nom);
create index if not exists idx_produits_actif on produits(actif);
create index if not exists idx_produits_famille on produits(famille_id);
create index if not exists idx_produits_unite on produits(unite_id);
create index if not exists idx_produits_main_supplier on produits(main_supplier_id);
create index if not exists idx_factures_mama on factures(mama_id);
create index if not exists idx_factures_date on factures(date);
create index if not exists idx_factures_fournisseur on factures(fournisseur_id);
create index if not exists idx_factures_statut on factures(statut);
create index if not exists idx_fiches_mama on fiches(mama_id);
create index if not exists idx_fiches_nom on fiches(nom);
create index if not exists idx_fiches_actif on fiches(actif);
create index if not exists idx_fiches_famille on fiches(famille_id);
create index if not exists idx_inventaires_mama on inventaires(mama_id);
create index if not exists idx_familles_mama on familles(mama_id);
create index if not exists idx_unites_mama on unites(mama_id);
create index if not exists idx_fournisseur_produits_mama on fournisseur_produits(mama_id);
create index if not exists idx_fournisseur_produits_produit on fournisseur_produits(produit_id);
create index if not exists idx_fournisseur_produits_fournisseur on fournisseur_produits(fournisseur_id);
create index if not exists idx_fournisseur_produits_produit_date on fournisseur_produits(produit_id, date_livraison desc);
create index if not exists idx_facture_lignes_mama on facture_lignes(mama_id);
create index if not exists idx_facture_lignes_facture on facture_lignes(facture_id);
create index if not exists idx_facture_lignes_produit on facture_lignes(produit_id);
create index if not exists idx_fiche_lignes_mama on fiche_lignes(mama_id);
create index if not exists idx_fiche_lignes_fiche on fiche_lignes(fiche_id);
create index if not exists idx_fiche_lignes_produit on fiche_lignes(produit_id);
create index if not exists idx_fiche_cout_history_mama on fiche_cout_history(mama_id);
create index if not exists idx_fiche_cout_history_fiche on fiche_cout_history(fiche_id);
create index if not exists idx_inventaire_lignes_mama on inventaire_lignes(mama_id);
create index if not exists idx_inventaire_lignes_inventaire on inventaire_lignes(inventaire_id);
create index if not exists idx_inventaire_lignes_produit on inventaire_lignes(produit_id);
create index if not exists idx_parametres_mama on parametres(mama_id);
create index if not exists idx_fournisseur_contacts_mama on fournisseur_contacts(mama_id);
create index if not exists idx_fournisseur_contacts_fournisseur on fournisseur_contacts(fournisseur_id);
create index if not exists idx_fournisseur_notes_mama on fournisseur_notes(mama_id);
create index if not exists idx_fournisseur_notes_fournisseur on fournisseur_notes(fournisseur_id);
create index if not exists idx_permissions_mama on permissions(mama_id);
create index if not exists idx_permissions_role on permissions(role_id);
create index if not exists idx_permissions_user on permissions(user_id);
create index if not exists idx_menus_mama on menus(mama_id);
create index if not exists idx_menus_date on menus(date);
create index if not exists idx_menu_fiches_menu on menu_fiches(menu_id);
create index if not exists idx_menu_fiches_fiche on menu_fiches(fiche_id);
create index if not exists idx_requisitions_mama on requisitions(mama_id);
create index if not exists idx_requisitions_produit on requisitions(produit_id);
create index if not exists idx_requisitions_zone on requisitions(zone_id);
create index if not exists idx_requisitions_date on requisitions(date);
create index if not exists idx_transferts_mama on transferts(mama_id);
create index if not exists idx_transferts_produit on transferts(produit_id);
create index if not exists idx_zones_stock_mama on zones_stock(mama_id);
create index if not exists idx_zones_stock_actif on zones_stock(actif);
-- Index pour accélérer la recherche par zone dans les mouvements de stock
create index if not exists idx_mouvements_stock_zone_source on mouvements_stock(zone_source_id);
create index if not exists idx_mouvements_stock_zone_destination on mouvements_stock(zone_destination_id);
create index if not exists idx_inventaire_zones_mama on inventaire_zones(mama_id);
create index if not exists idx_ventes_boissons_mama on ventes_boissons(mama_id);
create index if not exists idx_ventes_boissons_boisson on ventes_boissons(boisson_id);
create or replace view stock_mouvements as select * from mouvements_stock;
grant select on stock_mouvements to authenticated;
create or replace view stocks as select * from mouvements_stock;
grant select on stocks to authenticated;

-- Trigger de mise à jour du PMP produit et du stock lors de l'insertion de ligne de facture
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

drop trigger if exists trg_facture_ligne on facture_lignes;
create trigger trg_facture_ligne after insert on facture_lignes
  for each row execute procedure mettre_a_jour_pmp_produit();

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
  select fournisseur_id, date into supp, d from factures where id = new.facture_id;
  if supp is null then
    return new;
  end if;
  insert into fournisseur_produits(produit_id, fournisseur_id, prix_achat, date_livraison, mama_id)
    values (new.produit_id, supp, new.prix_unitaire, d, new.mama_id)
    on conflict (produit_id, fournisseur_id, date_livraison)
    do update set prix_achat = excluded.prix_achat, updated_at = now();
  update produits
     set dernier_prix = new.prix_unitaire,
         main_supplier_id = coalesce(main_supplier_id, supp)
   where id = new.produit_id;
  return new;
end;
$$;

drop trigger if exists trg_update_prix_produit on facture_lignes;
create trigger trg_update_prix_produit
  after insert on facture_lignes
  for each row execute procedure mettre_a_jour_prix_produit();

-- Trigger pour maintenir le total de la facture en phase avec ses lignes
create or replace function refresh_facture_total()
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

drop trigger if exists trg_facture_total on facture_lignes;
create trigger trg_facture_total
  after insert or update or delete on facture_lignes
  for each row execute procedure refresh_facture_total();

-- Trigger de mise à jour du stock théorique lors de l'enregistrement des mouvements
create or replace function update_stock_theorique()
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
create trigger trg_mouvement_stock after insert on mouvements_stock
  for each row execute procedure update_stock_theorique();

-- Trigger pour appliquer les lignes d'inventaire au stock réel
create or replace function apply_inventaire_line()
returns trigger language plpgsql as $$
begin
  update produits set stock_reel = new.quantite where id = new.produit_id;
  return new;
end;
$$;

drop trigger if exists trg_inventaire_ligne on inventaire_lignes;
create trigger trg_inventaire_ligne after insert on inventaire_lignes
  for each row execute procedure apply_inventaire_line();

-- Trigger de rafraîchissement du coût des fiches lors des modifications
create or replace function refresh_fiche_cost()
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

  insert into fiche_cout_history (fiche_id, date, cout_total, cout_par_portion, mama_id)
  values (fid, current_date, coalesce(total,0), coalesce(total,0)/nullif(portions,0), mid);

  return new;
end;
$$;

drop trigger if exists trg_fiche_lignes_cost on fiche_lignes;
create trigger trg_fiche_lignes_cost
  after insert or update or delete on fiche_lignes
  for each row execute procedure refresh_fiche_cost();

drop trigger if exists trg_fiche_update_cost on fiches;
create trigger trg_fiche_update_cost
  after update on fiches
  for each row execute procedure refresh_fiche_cost();

-- Statistiques : total des achats par mois pour tous les fournisseurs
create or replace function stats_achats_fournisseurs(mama_id_param uuid)
returns table(mois text, total_achats numeric)
language sql as $$
  select to_char(f.date, 'YYYY-MM') as mois,
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
  select to_char(f.date, 'YYYY-MM') as mois,
         sum(fl.total) as total_achats
  from factures f
    join facture_lignes fl on fl.facture_id = f.id
  where f.mama_id = mama_id_param
    and f.fournisseur_id = fournisseur_id_param
  group by 1
  order by 1;
$$;
grant execute on function stats_achats_fournisseur(uuid, uuid) to authenticated;
-- Statistiques : rotation du produit par mois
create or replace function stats_rotation_produit(mama_id_param uuid, produit_id_param uuid)
returns table(mois text, quantite_sortie numeric)
language sql as $$
  select to_char(date, 'YYYY-MM') as mois,
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
    actif boolean default true,
    created_at timestamptz default now(),
    unique (mama_id, nom)
);

-- Table de liaison des mouvements de stock aux centres de coût (ventilation)
create table if not exists mouvements_centres_cout (
    id uuid primary key default uuid_generate_v4(),
    mouvement_id uuid references mouvements_stock(id) on delete cascade,
    cost_center_id uuid references centres_de_cout(id) on delete cascade,
    quantite numeric,
    valeur numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Index pour des requêtes plus rapides
create index if not exists idx_centres_de_cout_mama on centres_de_cout(mama_id);
create index if not exists idx_centres_de_cout_nom on centres_de_cout(nom);
create index if not exists idx_mouvements_cc_mama on mouvements_centres_cout(mama_id);
create index if not exists idx_mouvements_cc_mouvement on mouvements_centres_cout(mouvement_id);
create index if not exists idx_mouvements_cc_centre on mouvements_centres_cout(cost_center_id);

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
    created_at timestamptz default now()
);

create index if not exists idx_journaux_utilisateur_mama on journaux_utilisateur(mama_id);
create index if not exists idx_journaux_utilisateur_user on journaux_utilisateur(user_id);
create index if not exists idx_journaux_utilisateur_done on journaux_utilisateur(done_by);
create index if not exists idx_journaux_utilisateur_date on journaux_utilisateur(created_at);

alter table journaux_utilisateur enable row level security;
alter table journaux_utilisateur force row level security;
drop policy if exists journaux_utilisateur_all on journaux_utilisateur;
create policy journaux_utilisateur_all on journaux_utilisateur
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on journaux_utilisateur to authenticated;

-- Vue récapitulative de la consommation par centre de coût
create or replace view v_cost_center_totals as
select
  c.mama_id,
  c.id as cost_center_id,
  c.nom,
  coalesce(sum(m.quantite),0) as quantite_totale,
  coalesce(sum(m.valeur),0) as valeur_totale
from centres_de_cout c
left join mouvements_centres_cout m on m.cost_center_id = c.id
group by c.mama_id, c.id, c.nom;
grant select on v_cost_center_totals to authenticated;

-- Vue mensuelle de la consommation par centre de coût
create or replace view v_cost_center_monthly as
select
  c.mama_id,
  c.id as cost_center_id,
  date_trunc('month', m.created_at) as mois,
  c.nom,
  coalesce(sum(m.quantite),0) as quantite,
  coalesce(sum(m.valeur),0) as valeur
from centres_de_cout c
left join mouvements_centres_cout m on m.cost_center_id = c.id
group by c.mama_id, c.id, mois, c.nom;
grant select on v_cost_center_monthly to authenticated;

-- Vue alias pour les totaux mensuels par centre de coût
create or replace view v_cost_center_month as
select * from v_cost_center_monthly;
grant select on v_cost_center_month to authenticated;

-- Fonction retournant les statistiques par centre de coût pour une période donnée
create or replace function stats_centres_de_cout(mama_id_param uuid, debut_param date default null, fin_param date default null)
returns table(cost_center_id uuid, nom text, quantite numeric, valeur numeric)
language plpgsql security definer as $$
begin
  return query
    select c.id, c.nom, sum(coalesce(m.quantite,0)), sum(coalesce(m.valeur,0))
    from centres_de_cout c
    left join mouvements_centres_cout m on m.cost_center_id = c.id
      and (debut_param is null or m.created_at >= debut_param)
      and (fin_param is null or m.created_at < fin_param + interval '1 day')
    where c.mama_id = mama_id_param
    group by c.id, c.nom;
end;
$$;
grant execute on function stats_centres_de_cout(uuid, date, date) to authenticated;

-- Fonction déclenchée pour journaliser les changements de centre de coût
create or replace function log_centres_de_cout_changes()
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

drop trigger if exists trg_log_centres_de_cout on centres_de_cout;
create trigger trg_log_centres_de_cout
  after insert or update or delete on centres_de_cout
  for each row execute function log_centres_de_cout_changes();
grant execute on function log_centres_de_cout_changes() to authenticated;

-- Fonction déclenchée pour journaliser l'affectation des mouvements aux centres de coût
create or replace function log_mouvement_cc_changes()
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

drop trigger if exists trg_log_mouvement_cc on mouvements_centres_cout;
create trigger trg_log_mouvement_cc
  after insert or update or delete on mouvements_centres_cout
  for each row execute function log_mouvement_cc_changes();
grant execute on function log_mouvement_cc_changes() to authenticated;

-- Vue détaillée des affectations de mouvements de stock
create or replace view v_ventilation as
select
  mc.mama_id,
  mc.mouvement_id,
  m.date,
  m.produit_id,
  mc.cost_center_id,
  cc.nom as cost_center,
  mc.quantite,
  mc.valeur
from mouvements_centres_cout mc
join mouvements_stock m on m.id = mc.mouvement_id
join centres_de_cout cc on cc.id = mc.cost_center_id;
grant select on v_ventilation to authenticated;

-- Vue des fournisseurs sans facture depuis 6 mois
create or replace view v_fournisseurs_inactifs as
select
  f.mama_id,
  f.id as fournisseur_id,
  f.nom,
  max(fc.date) as last_invoice_date,
  date_part('month', age(current_date, max(fc.date))) as months_since_last_invoice
from fournisseurs f
left join factures fc on fc.fournisseur_id = f.id
where f.mama_id is not null
  group by f.mama_id, f.id, f.nom
  having coalesce(max(fc.date), current_date - interval '999 months') < current_date - interval '6 months';
grant select on v_fournisseurs_inactifs to authenticated;

-- Table des pertes produits
create table if not exists pertes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    produit_id uuid not null references produits(id) on delete cascade,
    cost_center_id uuid references centres_de_cout(id),
    date_perte date not null default current_date,
    quantite numeric not null,
    motif text,
    created_at timestamptz default now(),
    created_by uuid references users(id)
);
create index if not exists idx_pertes_mama on pertes(mama_id);
create index if not exists idx_pertes_produit on pertes(produit_id);

-- RLS pour la table pertes
alter table pertes enable row level security;
alter table pertes force row level security;
drop policy if exists pertes_all on pertes;
create policy pertes_all on pertes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on pertes to authenticated;


-- Trigger de journalisation des pertes
create or replace function log_pertes_changes()
returns trigger language plpgsql as $$
begin
  insert into journaux_utilisateur(mama_id, user_id, action, details, done_by)
  values(new.mama_id, auth.uid(), 'pertes ' || tg_op,
         jsonb_build_object('id', new.id, 'produit_id', new.produit_id),
         auth.uid());
  return new;
end;
$$;
drop trigger if exists trg_log_pertes on pertes;
create trigger trg_log_pertes
  after insert or update or delete on pertes
  for each row execute function log_pertes_changes();


-- Fonction suggérant les allocations de centre de coût selon l'historique
create or replace function suggest_centres_de_cout(p_produit_id uuid)
returns table(cost_center_id uuid, nom text, ratio numeric)
language sql stable security definer as $$
  select
    mcc.cost_center_id,
    cc.nom,
    sum(mcc.quantite)::numeric / greatest(sum(sum_mcc.quantite),1) as ratio
  from mouvements_centres_cout mcc
  join mouvements_stock ms on ms.id = mcc.mouvement_id
  join centres_de_cout cc on cc.id = mcc.cost_center_id
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
  group by mcc.cost_center_id, cc.nom;
$$;
grant execute on function suggest_centres_de_cout(uuid) to authenticated;

-- Vue du prix moyen d'achat mensuel par produit
create or replace view v_tendance_prix_produit as
select
  fl.mama_id,
  fl.produit_id,
  date_trunc('month', f.date) as mois,
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
  coalesce(avg(sp.prix_achat),0) as pmp
from produits p
left join fournisseur_produits sp on sp.produit_id = p.id and sp.mama_id = p.mama_id
group by p.mama_id, p.id;
grant select on v_pmp to authenticated;

-- Variation de prix fournisseurs
create or replace view v_reco_surcout as
select
  sp.mama_id,
  sp.fournisseur_id,
  sp.produit_id,
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
  count(fc.id) as nb_factures
from fournisseurs f
left join factures fc on fc.fournisseur_id = f.id
group by f.mama_id, f.id, f.nom;
grant select on v_fournisseur_stats to authenticated;

-- Vue des produits avec leur dernier prix fournisseur
create or replace view v_produits_dernier_prix as
select
  p.id,
  p.nom,
  f.nom as famille,
  u.nom as unite,
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
  p.main_supplier_id,
  p.mama_id,
  p.created_at,
  sp.prix_achat as dernier_prix,
  sp.date_livraison as dernier_prix_date,
  sp.fournisseur_id as dernier_fournisseur_id
from produits p
left join familles f on f.id = p.famille_id and f.mama_id = p.mama_id
left join unites u on u.id = p.unite_id and u.mama_id = p.mama_id
left join lateral (
  select prix_achat, date_livraison, fournisseur_id
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
create or replace function enable_two_fa(p_secret text)
returns void language sql security definer as $$
  update users set two_fa_enabled = true, two_fa_secret = p_secret
  where id = auth.uid();
$$;

create or replace function disable_two_fa()
returns void language sql security definer as $$
  update users set two_fa_enabled = false, two_fa_secret = null
  where id = auth.uid();
$$;
grant execute on function enable_two_fa(text) to authenticated;
grant execute on function disable_two_fa() to authenticated;
-- Fonction retournant les produits les plus consommés sur une période
create or replace function top_produits(
  mama_id_param uuid,
  debut_param date default null,
  fin_param date default null,
  limit_param integer default 5
)
returns table(produit_id uuid, nom text, total numeric)
language sql stable security definer as $$
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
create or replace function mouvements_without_alloc(limit_param integer default 100)
returns table(id uuid, produit_id uuid, quantite numeric, created_at timestamptz, mama_id uuid)
language sql stable security definer as $$
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
create index if not exists idx_users_email on users(email);

-- Colonnes texte optionnelles famille/unité pour les produits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='produits' AND column_name='famille'
  ) THEN
    ALTER TABLE produits ADD COLUMN famille text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='produits' AND column_name='unite'
  ) THEN
    ALTER TABLE produits ADD COLUMN unite text;
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
    ALTER TABLE fiches_techniques ADD COLUMN carte_actuelle boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiches_techniques' AND column_name='type_carte'
  ) THEN
    ALTER TABLE fiches_techniques ADD COLUMN type_carte text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiches_techniques' AND column_name='sous_type_carte'
  ) THEN
    ALTER TABLE fiches_techniques ADD COLUMN sous_type_carte text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fiches_techniques' AND column_name='prix_vente'
  ) THEN
    ALTER TABLE fiches_techniques ADD COLUMN prix_vente numeric;
  END IF;
END $$;

create index if not exists idx_ft_carte on fiches_techniques(carte_actuelle, type_carte, sous_type_carte);
create index if not exists idx_ft_prix on fiches_techniques(prix_vente);
create index if not exists idx_ft_nom on fiches_techniques(nom);

alter table fiches_techniques enable row level security;
alter table fiches_techniques force row level security;
drop policy if exists fiches_techniques_all on fiches_techniques;
create policy fiches_techniques_all on fiches_techniques
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on fiches_techniques to authenticated;

-- Table d'audit des changements de prix
create table if not exists fiche_prix_history (
    id uuid primary key default uuid_generate_v4(),
    fiche_id uuid references fiches_techniques(id) on delete cascade,
    old_prix numeric,
    new_prix numeric,
    changed_by uuid references users(id),
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    changed_at timestamptz default now()
);
create index if not exists idx_fiche_prix_history_fiche on fiche_prix_history(fiche_id);

alter table fiche_prix_history enable row level security;
alter table fiche_prix_history force row level security;
drop policy if exists fiche_prix_history_all on fiche_prix_history;
create policy fiche_prix_history_all on fiche_prix_history
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on fiche_prix_history to authenticated;

create or replace function log_fiche_prix_change()
returns trigger language plpgsql as $$
begin
  if new.prix_vente is distinct from old.prix_vente or new.carte_actuelle is distinct from old.carte_actuelle then
    insert into fiche_prix_history (fiche_id, old_prix, new_prix, changed_by, mama_id)
    values (new.id, old.prix_vente, new.prix_vente, auth.uid(), new.mama_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fiche_prix_change on fiches_techniques;
create trigger trg_fiche_prix_change
after update on fiches_techniques
for each row execute procedure log_fiche_prix_change();

-- Index pour accélérer les requêtes de mouvements
create index if not exists idx_mouvements_stock_mama on mouvements_stock(mama_id);
create index if not exists idx_mouvements_stock_produit on mouvements_stock(produit_id);
create index if not exists idx_mouvements_stock_date on mouvements_stock(date);
create index if not exists idx_mouvements_stock_type on mouvements_stock(type);

-- Ajout de la colonne date_debut pour les inventaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='inventaires' AND column_name='date_debut'
  ) THEN
    ALTER TABLE inventaires ADD COLUMN date_debut date;
  END IF;
END $$;

create index if not exists idx_inventaires_date on inventaires(date);
create index if not exists idx_inventaires_date_debut on inventaires(date_debut);

create index if not exists idx_produits_famille_txt on produits(famille);
create index if not exists idx_produits_unite_txt on produits(unite);
create index if not exists idx_produits_code on produits(code);

-- Fonction de statistiques pour le tableau de bord
create or replace function dashboard_stats(
  mama_id_param uuid,
  page_param integer default 1,
  page_size_param integer default 30
)
returns table(produit_id uuid, nom text, stock_reel numeric, pmp numeric, last_purchase timestamptz)
language sql stable security definer as $$
  select p.id, p.nom, p.stock_reel, p.pmp, max(f.date) as last_purchase
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
    updated_at timestamptz default now()
);
create index if not exists idx_taches_mama on taches(mama_id);
create index if not exists idx_taches_echeance on taches(date_echeance);
create index if not exists idx_taches_statut on taches(statut);
create index if not exists idx_taches_priorite on taches(priorite);

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
    created_at timestamptz default now()
);
create index if not exists idx_tache_instances_tache on tache_instances(tache_id);
create index if not exists idx_tache_instances_date on tache_instances(date_echeance);
create index if not exists idx_tache_instances_statut on tache_instances(statut);
create index if not exists idx_tache_instances_done on tache_instances(done_by);

alter table tache_instances enable row level security;
alter table tache_instances force row level security;
drop policy if exists tache_instances_all on tache_instances;
create policy tache_instances_all on tache_instances
  for all using (exists (select 1 from taches where taches.id = tache_instances.tache_id and taches.mama_id = current_user_mama_id()))
  with check (exists (select 1 from taches where taches.id = tache_instances.tache_id and taches.mama_id = current_user_mama_id()));
grant select, insert, update, delete on tache_instances to authenticated;

-- Autoriser l'exécution des fonctions utilitaires
grant execute on function dashboard_stats(uuid, integer, integer) to authenticated;
grant execute on function top_produits(uuid, date, date, integer) to authenticated;
grant execute on function mouvements_without_alloc(integer) to authenticated;

-- Index pour accélérer la recherche de factures
create index if not exists idx_factures_reference on factures(reference);

-- Colonnes optionnelles sur mouvements_stock pour stocker les détails
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='sous_type'
  ) THEN
    ALTER TABLE mouvements_stock ADD COLUMN sous_type text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='zone'
  ) THEN
    ALTER TABLE mouvements_stock ADD COLUMN zone text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='mouvements_stock' AND column_name='motif'
  ) THEN
    ALTER TABLE mouvements_stock ADD COLUMN motif text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mouvements_stock' AND column_name='sous_type') THEN
    CREATE INDEX IF NOT EXISTS idx_mouvements_stock_sous_type ON mouvements_stock(sous_type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mouvements_stock' AND column_name='zone') THEN
    CREATE INDEX IF NOT EXISTS idx_mouvements_stock_zone ON mouvements_stock(zone);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mouvements_stock' AND column_name='motif') THEN
    CREATE INDEX IF NOT EXISTS idx_mouvements_stock_motif ON mouvements_stock(motif);
  END IF;
END $$;

-- Table des ventes pour l'ingénierie de menu
create table if not exists ventes_fiches_carte (
  id uuid primary key default uuid_generate_v4(),
  fiche_id uuid references fiches_techniques(id) on delete cascade,
  periode date not null,
  ventes integer not null,
  mama_id uuid references mamas(id) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (fiche_id, periode, mama_id)
);
create index if not exists idx_vfc_fiche_periode_mama on ventes_fiches_carte(fiche_id, periode, mama_id);
create index if not exists idx_vfc_periode on ventes_fiches_carte(periode);

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
    actif boolean default true,
    created_at timestamptz default now(),
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
    unique (promotion_id, produit_id)
);

create index if not exists idx_promotions_mama on promotions(mama_id);
create index if not exists idx_promotions_actif on promotions(actif);
create index if not exists idx_promo_prod_mama on promotion_produits(mama_id);
create index if not exists idx_promo_prod_promotion on promotion_produits(promotion_id);
create index if not exists idx_promo_prod_produit on promotion_produits(produit_id);

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

create or replace function log_promotions_changes()
returns trigger language plpgsql as $$
begin
  insert into journaux_utilisateur(mama_id, user_id, action, details, done_by)
  values(coalesce(new.mama_id, old.mama_id), auth.uid(), 'promotions ' || tg_op,
         jsonb_build_object('id_new', new.id, 'id_old', old.id), auth.uid());
  return new;
end;
$$;

drop trigger if exists trg_log_promotions on promotions;
create trigger trg_log_promotions
  after insert or update or delete on promotions
  for each row execute function log_promotions_changes();

-- Vue et fonction pour les statistiques consolidées multi-sites
create or replace view v_consolidated_stats as
select
  m.id as mama_id,
  m.nom,
  coalesce(sum(p.stock_reel * p.pmp),0) as stock_valorise,
  (select count(*) from mouvements_stock ms where ms.mama_id = m.id) as nb_mouvements,
  (select sum(abs(ms.quantite)) from mouvements_stock ms
      where ms.mama_id = m.id and ms.type='sortie'
        and date_trunc('month', ms.date) = date_trunc('month', current_date)) as conso_mois
from mamas m
left join produits p on p.mama_id = m.id
group by m.id, m.nom;
grant select on v_consolidated_stats to authenticated;

create or replace function consolidated_stats()
returns table(
  mama_id uuid,
  nom text,
  stock_valorise numeric,
  conso_mois numeric,
  nb_mouvements bigint
)
language sql
security definer as $$
  select * from v_consolidated_stats
  where (
    select r.nom from users u join roles r on r.id = u.role_id where u.id = auth.uid()
  ) = 'superadmin' or mama_id = current_user_mama_id();
$$;

grant execute on function consolidated_stats() to authenticated;

-- Journal avancé conforme aux obligations légales
create table if not exists audit_entries (
    id serial primary key,
    mama_id uuid not null references mamas(id) on delete cascade,
    table_name text not null,
    row_id uuid,
    operation text not null,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid references users(id) on delete set null,
    created_at timestamptz default now(),
    changed_at timestamptz default now()
);
create index if not exists idx_audit_entries_mama on audit_entries(mama_id);
create index if not exists idx_audit_entries_table on audit_entries(table_name);
create index if not exists idx_audit_entries_date on audit_entries(changed_at);

alter table audit_entries enable row level security;
alter table audit_entries force row level security;
drop policy if exists audit_entries_all on audit_entries;
create policy audit_entries_all on audit_entries
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select on audit_entries to authenticated;

create or replace function add_audit_entry()
returns trigger language plpgsql security definer as $$
begin
  insert into audit_entries(mama_id, table_name, row_id, operation, old_data, new_data, changed_by)
  values(coalesce(new.mama_id, old.mama_id), TG_TABLE_NAME, coalesce(new.id, old.id), TG_OP, to_jsonb(old), to_jsonb(new), auth.uid());
  return new;
end;
$$;
grant execute on function add_audit_entry() to authenticated;

drop trigger if exists trg_audit_produits on produits;
create trigger trg_audit_produits
  after insert or update or delete on produits
  for each row execute function add_audit_entry();
drop trigger if exists trg_audit_factures on factures;
create trigger trg_audit_factures
  after insert or update or delete on factures
  for each row execute function add_audit_entry();

-- Planning prévisionnel des besoins
create table if not exists planning_previsionnel (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    date_prevue date not null,
    notes text,
    created_by uuid references users(id) on delete set null,
    created_at timestamptz default now()
);
create index if not exists idx_planning_mama on planning_previsionnel(mama_id, date_prevue);
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
  for each row execute function add_audit_entry();

-- Alertes avancees automatique
create table if not exists alert_rules (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    produit_id uuid references produits(id) on delete cascade,
    threshold numeric not null,
    message text,
    enabled boolean default true,
    created_at timestamptz default now()
);
create index if not exists idx_alert_rules_mama on alert_rules(mama_id);
alter table alert_rules enable row level security;
alter table alert_rules force row level security;
drop policy if exists alert_rules_all on alert_rules;
create policy alert_rules_all on alert_rules
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on alert_rules to authenticated;

create table if not exists alert_logs (
    id uuid primary key default uuid_generate_v4(),
    rule_id uuid references alert_rules(id) on delete cascade,
    mama_id uuid not null references mamas(id) on delete cascade,
    produit_id uuid references produits(id) on delete cascade,
    stock_reel numeric,
    created_at timestamptz default now()
);
create index if not exists idx_alert_logs_mama on alert_logs(mama_id);
alter table alert_logs enable row level security;
alter table alert_logs force row level security;
drop policy if exists alert_logs_all on alert_logs;
create policy alert_logs_all on alert_logs
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select on alert_logs to authenticated;

create or replace function check_stock_alert()
returns trigger language plpgsql as $$
declare
  r record;
begin
  for r in
    select * from alert_rules
    where enabled and mama_id = new.mama_id
      and (produit_id is null or produit_id = new.id)
  loop
    if new.stock_reel < r.threshold then
      insert into alert_logs(rule_id, mama_id, produit_id, stock_reel)
        values (r.id, new.mama_id, new.id, new.stock_reel);
    end if;
  end loop;
  return new;
end;
$$;

grant execute on function check_stock_alert() to authenticated;

drop trigger if exists trg_stock_alert on produits;
create trigger trg_stock_alert
  after update of stock_reel on produits
  for each row execute function check_stock_alert();


-- Import automatique des factures electroniques
create table if not exists incoming_invoices (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    fournisseur_id uuid references fournisseurs(id) on delete set null,
    payload jsonb not null,
    processed boolean default false,
    created_at timestamptz default now()
);
create index if not exists idx_incoming_invoices_mama on incoming_invoices(mama_id);

alter table incoming_invoices enable row level security;
alter table incoming_invoices force row level security;
drop policy if exists incoming_invoices_all on incoming_invoices;
create policy incoming_invoices_all on incoming_invoices
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on incoming_invoices to authenticated;

create or replace function import_invoice(payload jsonb)
returns uuid language plpgsql security definer as $$
declare
  fac_id uuid;
  supp_id uuid;
begin
  select id into supp_id from fournisseurs
    where nom = payload->>'supplier_name'
      and mama_id = current_user_mama_id()
    limit 1;
  insert into factures(reference, date, fournisseur_id, montant, statut, mama_id)
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

grant execute on function import_invoice(jsonb) to authenticated;

-- Gestion documentaire avancée
create table if not exists documents (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    title text not null,
    file_url text not null,
    uploaded_by uuid references users(id) on delete set null,
    created_at timestamptz default now()
);
create index if not exists idx_documents_mama on documents(mama_id);

alter table documents enable row level security;
alter table documents force row level security;
drop policy if exists documents_all on documents;
create policy documents_all on documents
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

grant select, insert, update, delete on documents to authenticated;

-- Gestion fine des droits avec validations

create table if not exists validation_requests (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    module text not null,
    entity_id uuid,
    action text not null,
    status text default 'pending',
    requested_by uuid references users(id) on delete set null,
    reviewed_by uuid references users(id) on delete set null,
    reviewed_at timestamptz,
    comment text,
    created_at timestamptz default now()
);
create index if not exists idx_validation_requests_mama on validation_requests(mama_id);
create index if not exists idx_validation_requests_status on validation_requests(status);

alter table validation_requests enable row level security;
alter table validation_requests force row level security;
drop policy if exists validation_requests_select on validation_requests;
create policy validation_requests_select on validation_requests
  for select using (mama_id = current_user_mama_id());
drop policy if exists validation_requests_insert on validation_requests;
create policy validation_requests_insert on validation_requests
  for insert with check (
    mama_id = current_user_mama_id() and requested_by = auth.uid()
  );
drop policy if exists validation_requests_update on validation_requests;
create policy validation_requests_update on validation_requests
  for update using (
    mama_id = current_user_mama_id() and
    current_user_role() in ('admin','superadmin')
  ) with check (mama_id = current_user_mama_id());
drop policy if exists validation_requests_delete on validation_requests;
create policy validation_requests_delete on validation_requests
  for delete using (
    mama_id = current_user_mama_id() and current_user_role() in ('admin','superadmin')
  );

grant select, insert, update, delete on validation_requests to authenticated;

-- Vue pour l'analytique avancée
create or replace view v_monthly_purchases as
select
  f.mama_id,
  date_trunc('month', f.date) as month,
  sum(fl.total) as purchases
from factures f
join facture_lignes fl on fl.facture_id = f.id
group by f.mama_id, month;
grant select on v_monthly_purchases to authenticated;

create or replace function advanced_stats(start_date date default null, end_date date default null)
returns table(month date, purchases numeric)
language sql security definer as $$
  select month, purchases
  from v_monthly_purchases
  where mama_id = current_user_mama_id()
    and (start_date is null or month >= date_trunc('month', start_date))
    and (end_date is null or month <= date_trunc('month', end_date))
  order by month;
$$;
grant execute on function advanced_stats(date, date) to authenticated;

-- Suivi de l'onboarding par utilisateur
create table if not exists onboarding_progress (
    user_id uuid references users(id) on delete cascade,
    mama_id uuid not null references mamas(id) on delete cascade,
    step integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    primary key(user_id, mama_id)
);
create index if not exists idx_onboarding_mama on onboarding_progress(mama_id);
alter table onboarding_progress enable row level security;
alter table onboarding_progress force row level security;
drop policy if exists onboarding_progress_select on onboarding_progress;
create policy onboarding_progress_select on onboarding_progress
  for select to authenticated
  using (user_id = auth.uid());
drop policy if exists onboarding_progress_insert on onboarding_progress;
create policy onboarding_progress_insert on onboarding_progress
  for insert to authenticated
  with check (user_id = auth.uid() and mama_id = current_user_mama_id());
drop policy if exists onboarding_progress_update on onboarding_progress;
create policy onboarding_progress_update on onboarding_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
grant select, insert, update on onboarding_progress to authenticated;

-- Historique détaillé des étapes d'onboarding
create table if not exists etapes_onboarding (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade,
    etape text,
    statut text check (statut in ('en cours','terminé','sauté')),
    mama_id uuid not null references mamas(id) on delete cascade,
    created_at timestamptz default now()
);
create index if not exists idx_etapes_onboarding_mama on etapes_onboarding(mama_id);
alter table etapes_onboarding enable row level security;
alter table etapes_onboarding force row level security;
drop policy if exists etapes_onboarding_select on etapes_onboarding;
create policy etapes_onboarding_select on etapes_onboarding
  for select to authenticated
  using (mama_id = current_user_mama_id());
drop policy if exists etapes_onboarding_insert on etapes_onboarding;
create policy etapes_onboarding_insert on etapes_onboarding
  for insert to authenticated
  with check (mama_id = current_user_mama_id() and user_id = auth.uid());
drop policy if exists etapes_onboarding_update on etapes_onboarding;
create policy etapes_onboarding_update on etapes_onboarding
  for update to authenticated
  using (user_id = auth.uid() and mama_id = current_user_mama_id())
  with check (user_id = auth.uid() and mama_id = current_user_mama_id());
grant select, insert, update on etapes_onboarding to authenticated;

-- Articles d'aide et FAQ
create table if not exists help_articles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    title text not null,
    content text not null,
    role text default 'all',
    created_at timestamptz default now()
);
create index if not exists idx_help_articles_mama on help_articles(mama_id);
alter table help_articles enable row level security;
alter table help_articles force row level security;
drop policy if exists help_articles_select on help_articles;
create policy help_articles_select on help_articles
  for select to authenticated
  using (mama_id = current_user_mama_id());
drop policy if exists help_articles_mutation on help_articles;
create policy help_articles_mutation on help_articles
  for all to authenticated
  using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on help_articles to authenticated;


-- ----------------------------------------------------
-- Tables Supabase supplémentaires
-- ----------------------------------------------------
create table if not exists journaux_audit (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid,
    mama_id uuid,
    action text,
    table_name text,
    created_at timestamptz default now()
);

alter table journaux_audit enable row level security;
alter table journaux_audit force row level security;
drop policy if exists select_own_or_admin on journaux_audit;
create policy select_own_or_admin on journaux_audit
  for select using (
    user_id = auth.uid() or
    exists (
      select 1 from users u
      join roles r on u.role_id = r.id
      where u.id = auth.uid() and r.nom in ('admin','superadmin')
    )
  );
create index if not exists idx_journaux_audit_mama on journaux_audit(mama_id);
create index if not exists idx_journaux_audit_user on journaux_audit(user_id);
create index if not exists idx_journaux_audit_date on journaux_audit(created_at);
grant select on journaux_audit to authenticated;

create table if not exists tableaux_de_bord (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade,
    mama_id uuid references mamas(id) on delete cascade,
    nom text,
    created_at timestamptz default now()
);

alter table tableaux_de_bord enable row level security;
alter table tableaux_de_bord force row level security;
drop policy if exists tableaux_de_bord_owner on tableaux_de_bord;
create policy tableaux_de_bord_owner on tableaux_de_bord
  for all using (
    user_id = auth.uid() and mama_id = current_user_mama_id()
  ) with check (
    user_id = auth.uid() and mama_id = current_user_mama_id()
  );
grant select, insert, update, delete on tableaux_de_bord to authenticated;

create table if not exists gadgets (
    id uuid primary key default uuid_generate_v4(),
    dashboard_id uuid references tableaux_de_bord(id) on delete cascade,
    config jsonb,
    ordre int default 0
);

alter table gadgets enable row level security;
alter table gadgets force row level security;
drop policy if exists gadgets_owner on gadgets;
create policy gadgets_owner on gadgets
  for all using (
    exists (
      select 1 from tableaux_de_bord d
      where d.id = gadgets.dashboard_id
        and d.user_id = auth.uid()
        and d.mama_id = current_user_mama_id()
    )
  ) with check (
    exists (
      select 1 from tableaux_de_bord d
      where d.id = gadgets.dashboard_id
        and d.user_id = auth.uid()
        and d.mama_id = current_user_mama_id()
    )
  );
grant select, insert, update, delete on gadgets to authenticated;

create table if not exists compta_mapping (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    type text not null,
    cle text not null,
    compte text not null,
    created_at timestamptz default now(),
    unique(mama_id, type, cle)
);

alter table compta_mapping enable row level security;
alter table compta_mapping force row level security;
drop policy if exists compta_mapping_admin on compta_mapping;
create policy compta_mapping_admin on compta_mapping
  for all using (
    mama_id = current_user_mama_id() and
    exists (
      select 1 from users u
      join roles r on u.role_id = r.id
      where u.id = auth.uid() and r.nom in ('admin','superadmin','compta')
    )
  )
  with check (
    mama_id = current_user_mama_id() and
    exists (
      select 1 from users u
      join roles r on u.role_id = r.id
      where u.id = auth.uid() and r.nom in ('admin','superadmin','compta')
    )
  );
grant select, insert, update, delete on compta_mapping to authenticated;

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


create table if not exists public.two_factor_auth (
    id uuid primary key references auth.users(id) on delete cascade,
    secret text,
    enabled boolean default false,
    created_at timestamptz default now()
);
alter table public.two_factor_auth enable row level security;
alter table public.two_factor_auth force row level security;
drop policy if exists two_factor_select on public.two_factor_auth;
create policy two_factor_select on public.two_factor_auth
  for select using (auth.uid() = id);
drop policy if exists two_factor_upsert on public.two_factor_auth;
create policy two_factor_upsert on public.two_factor_auth
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ----------------------------------------------------
-- Vues Supabase supplémentaires
-- ----------------------------------------------------
create or replace view v_analytique_stock as
select
  m.date,
  m.produit_id,
  f.nom as famille,
  mc.cost_center_id,
  c.nom as cost_center_nom,
  m.quantite,
  mc.valeur,
  m.mama_id
from mouvements_stock m
left join mouvements_centres_cout mc on mc.mouvement_id = m.id
left join centres_de_cout c on c.id = mc.cost_center_id
left join produits p on p.id = m.produit_id
left join familles f on f.id = p.famille_id and f.mama_id = p.mama_id;
grant select on v_analytique_stock to authenticated;

create or replace view v_reco_rotation as
select
  p.id as produit_id,
  p.nom,
  p.mama_id,
  current_date - coalesce(max(m.date), current_date) as jours_inactif
from produits p
left join mouvements_stock m on m.produit_id = p.id
where p.actif = true
group by p.id, p.nom, p.mama_id;
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
  p.nom as nom_produit
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
create or replace function cron_purge_inactive_users()
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
    perform cron.schedule('purge_inactive_users', '0 3 * * *', 'call cron_purge_inactive_users();');
  else
    raise notice 'cron.schedule not available';
  end if;
END $$;

create or replace function fn_calc_budgets(mama_id_param uuid, periode_param text)
returns table(famille text, budget_prevu numeric, total_reel numeric, ecart_pct numeric)
language sql as $$
  with hist as (
    select to_char(f.date,'YYYY-MM') as mois,
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
grant execute on function fn_calc_budgets to authenticated;

-- Configuration API fournisseurs
create table if not exists fournisseurs_api_config (
  fournisseur_id uuid references fournisseurs(id) on delete cascade,
  mama_id uuid not null references mamas(id),
  url text,
  type_api text default 'rest',
  token text,
  format_facture text default 'json',
  actif boolean default true,
  created_at timestamptz default now(),
  primary key(fournisseur_id, mama_id)
);
create index if not exists idx_fournisseurs_api_config_fourn on fournisseurs_api_config(fournisseur_id);
create index if not exists idx_fournisseurs_api_config_mama on fournisseurs_api_config(mama_id);
alter table fournisseurs_api_config enable row level security;
alter table fournisseurs_api_config force row level security;
drop policy if exists fournisseurs_api_config_all on fournisseurs_api_config;
create policy fournisseurs_api_config_all on fournisseurs_api_config
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- L'inscription manuelle renseigne désormais la table utilisateurs, aucun trigger sur auth.users n'est nécessaire
-- Fonction conservée à titre de référence sans création de trigger pour compatibilité
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into utilisateurs(auth_id, email, mama_id, role, access_rights)
  values (new.id, new.email,
          (select id from public.mamas limit 1),
          'user', '{}'::jsonb)
  on conflict do nothing;
  return new;
end;
$$;

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

-- Création également du profil correspondant dans utilisateurs pour l'auth Supabase
insert into utilisateurs(auth_id, email, mama_id, role, access_rights)
values (
  'a49aeafd-6f60-4f68-a267-d7d27c1a1381',
  'admin@mamastock.com',
  '29c992df-f6b0-47c5-9afa-c965b789aa07',
  'admin',
  '{}'::jsonb
) on conflict (auth_id) do nothing;

-- ----------------------------------------------------

-- Fin du script
