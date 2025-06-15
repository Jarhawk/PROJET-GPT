-- init.sql - Complete database setup for MamaStock
-- Extension
create extension if not exists "uuid-ossp";

-- ------------------
-- Base tables
-- ------------------
create table if not exists mamas (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    logo text,
    contact text,
    created_at timestamptz default now()
);

create table if not exists roles (
    id serial primary key,
    nom text not null unique,
    description text
);

create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    email text not null unique,
    password text,
    role_id integer references roles(id),
    access_rights jsonb default '[]',
    actif boolean default true,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

create or replace function current_user_mama_id()
returns uuid
language sql
stable
security definer
as $$
  select mama_id from users where id = auth.uid();
$$;

-- Families / Units
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

-- Suppliers
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

-- Products
create table if not exists products (
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

-- Supplier prices history
create table if not exists supplier_products (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    fournisseur_id uuid references fournisseurs(id) on delete cascade,
    prix_achat numeric not null,
    date_livraison date default current_date,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(product_id, fournisseur_id, date_livraison)
);

-- Factures
create table if not exists factures (
    id uuid primary key default uuid_generate_v4(),
    reference text,
    date date not null,
    fournisseur_id uuid references fournisseurs(id) on delete set null,
    montant numeric,
    statut text,
    justificatif text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

create table if not exists facture_lignes (
    id uuid primary key default uuid_generate_v4(),
    facture_id uuid references factures(id) on delete cascade,
    product_id uuid references products(id) on delete set null,
    quantite numeric not null,
    prix_unitaire numeric not null,
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
    product_id uuid references products(id) on delete set null,
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
    product_id uuid references products(id) on delete set null,
    quantite numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

create table if not exists mouvements_stock (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete set null,
    date date default current_date,
    type text check (type in ('entree','sortie','correction','transfert')),
    quantite numeric,
    inventaire_id uuid references inventaires(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Supplier contacts & notes
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
    role_id integer references roles(id) on delete cascade,
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
    zone text,
    status text,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

create table if not exists requisition_lines (
    id uuid primary key default uuid_generate_v4(),
    requisition_id uuid references requisitions(id) on delete cascade,
    produit_id uuid references products(id) on delete set null,
    quantite numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Transferts de stock
create table if not exists transferts (
    id uuid primary key default uuid_generate_v4(),
    produit_id uuid references products(id) on delete set null,
    quantite numeric,
    zone_depart text,
    zone_arrivee text,
    motif text,
    date_transfert date default current_date,
    created_by uuid references users(id) on delete set null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Zones de stock
create table if not exists zones_stock (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique(mama_id, nom)
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

-- Indexes
create index if not exists idx_users_mama on users(mama_id);
create index if not exists idx_users_role on users(role_id);
create index if not exists idx_users_actif on users(actif);
create index if not exists idx_fournisseurs_mama on fournisseurs(mama_id);
create index if not exists idx_fournisseurs_nom on fournisseurs(nom);
create index if not exists idx_fournisseurs_ville on fournisseurs(ville);
create index if not exists idx_fournisseurs_actif on fournisseurs(actif);
create index if not exists idx_products_mama on products(mama_id);
create index if not exists idx_products_nom on products(nom);
create index if not exists idx_products_actif on products(actif);
create index if not exists idx_products_famille on products(famille_id);
create index if not exists idx_products_unite on products(unite_id);
create index if not exists idx_products_main_supplier on products(main_supplier_id);
create index if not exists idx_factures_mama on factures(mama_id);
create index if not exists idx_factures_date on factures(date);
create index if not exists idx_factures_fournisseur on factures(fournisseur_id);
create index if not exists idx_factures_statut on factures(statut);
create index if not exists idx_fiches_mama on fiches(mama_id);
create index if not exists idx_fiches_nom on fiches(nom);
create index if not exists idx_fiches_actif on fiches(actif);
create index if not exists idx_fiches_famille on fiches(famille_id);
create index if not exists idx_inventaires_mama on inventaires(mama_id);
create index if not exists idx_mouvements_mama on mouvements_stock(mama_id);
create index if not exists idx_mouvements_product on mouvements_stock(product_id);
create index if not exists idx_familles_mama on familles(mama_id);
create index if not exists idx_unites_mama on unites(mama_id);
create index if not exists idx_supplier_products_mama on supplier_products(mama_id);
create index if not exists idx_supplier_products_product on supplier_products(product_id);
create index if not exists idx_supplier_products_fournisseur on supplier_products(fournisseur_id);
create index if not exists idx_facture_lignes_mama on facture_lignes(mama_id);
create index if not exists idx_facture_lignes_facture on facture_lignes(facture_id);
create index if not exists idx_facture_lignes_product on facture_lignes(product_id);
create index if not exists idx_fiche_lignes_mama on fiche_lignes(mama_id);
create index if not exists idx_fiche_lignes_fiche on fiche_lignes(fiche_id);
create index if not exists idx_fiche_lignes_product on fiche_lignes(product_id);
create index if not exists idx_fiche_cout_history_mama on fiche_cout_history(mama_id);
create index if not exists idx_fiche_cout_history_fiche on fiche_cout_history(fiche_id);
create index if not exists idx_inventaire_lignes_mama on inventaire_lignes(mama_id);
create index if not exists idx_inventaire_lignes_inventaire on inventaire_lignes(inventaire_id);
create index if not exists idx_inventaire_lignes_product on inventaire_lignes(product_id);
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
create index if not exists idx_requisition_lines_requisition on requisition_lines(requisition_id);
create index if not exists idx_requisition_lines_produit on requisition_lines(produit_id);
create index if not exists idx_transferts_mama on transferts(mama_id);
create index if not exists idx_transferts_produit on transferts(produit_id);
create index if not exists idx_zones_stock_mama on zones_stock(mama_id);
create index if not exists idx_ventes_boissons_mama on ventes_boissons(mama_id);
create index if not exists idx_ventes_boissons_boisson on ventes_boissons(boisson_id);

-- Trigger to update product PMP and stock on facture line insert
create or replace function update_product_pmp()
returns trigger language plpgsql as $$
begin
  update products
    set pmp = ((coalesce(pmp,0) * stock_reel) + (new.quantite * new.prix_unitaire)) / nullif(stock_reel + new.quantite,0),
        stock_reel = stock_reel + new.quantite
  where id = new.product_id;
  return new;
end;
$$;

create trigger trg_facture_ligne after insert on facture_lignes
for each row execute procedure update_product_pmp();

-- Trigger to keep invoice total in sync with its lines
create or replace function refresh_facture_total()
returns trigger language plpgsql as $$
begin
  update factures f
    set montant = coalesce((select sum(total) from facture_lignes where facture_id = f.id),0)
  where f.id = coalesce(new.facture_id, old.facture_id);
  return new;
end;
$$;

create trigger trg_facture_total
after insert or update or delete on facture_lignes
for each row execute procedure refresh_facture_total();

-- Trigger to update theoretical stock when stock movements are recorded
create or replace function update_stock_theorique()
returns trigger language plpgsql as $$
begin
  if new.type = 'entree' or new.type = 'correction' or new.type = 'transfert' then
    update products set stock_theorique = stock_theorique + new.quantite where id = new.product_id;
  elsif new.type = 'sortie' then
    update products set stock_theorique = stock_theorique - new.quantite where id = new.product_id;
  end if;
  return new;
end;
$$;

create trigger trg_mouvement_stock after insert on mouvements_stock
for each row execute procedure update_stock_theorique();

-- Trigger to apply inventory lines to real stock
create or replace function apply_inventaire_line()
returns trigger language plpgsql as $$
begin
  update products set stock_reel = new.quantite where id = new.product_id;
  return new;
end;
$$;

create trigger trg_inventaire_ligne after insert on inventaire_lignes
for each row execute procedure apply_inventaire_line();

-- Trigger to refresh fiche costs whenever lines or portions change
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
      left join products p on fl.product_id = p.id
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

create trigger trg_fiche_lignes_cost
after insert or update or delete on fiche_lignes
for each row execute procedure refresh_fiche_cost();

create trigger trg_fiche_update_cost
after update on fiches
for each row execute procedure refresh_fiche_cost();

-- Stats: total purchases per month for all suppliers
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

-- Stats: total purchases per month for one supplier
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

-- Stats: product rotation per month
create or replace function stats_rotation_produit(mama_id_param uuid, product_id_param uuid)
returns table(mois text, quantite_sortie numeric)
language sql as $$
  select to_char(date, 'YYYY-MM') as mois,
         sum(quantite) as quantite_sortie
  from mouvements_stock
  where mama_id = mama_id_param
    and product_id = product_id_param
    and type = 'sortie'
  group by 1
  order by 1;
$$;
