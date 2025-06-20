-- mama_stock_patch.sql - additional tables for analytic cost center management

-- Table of cost centers per mama
create table if not exists cost_centers (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    nom text not null,
    actif boolean default true,
    created_at timestamptz default now(),
    unique (mama_id, nom)
);

-- Table linking stock movements to cost centers (ventilation)
create table if not exists mouvement_cost_centers (
    id uuid primary key default uuid_generate_v4(),
    mouvement_id uuid references mouvements_stock(id) on delete cascade,
    cost_center_id uuid references cost_centers(id) on delete cascade,
    quantite numeric,
    valeur numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now()
);

-- Indexes for faster queries
create index if not exists idx_cost_centers_mama on cost_centers(mama_id);
create index if not exists idx_cost_centers_nom on cost_centers(nom);
create index if not exists idx_mouvement_cc_mama on mouvement_cost_centers(mama_id);
create index if not exists idx_mouvement_cc_mouvement on mouvement_cost_centers(mouvement_id);
create index if not exists idx_mouvement_cc_cc on mouvement_cost_centers(cost_center_id);

-- Row level security policies
alter table cost_centers enable row level security;
alter table cost_centers force row level security;
drop policy if exists cost_centers_all on cost_centers;
create policy cost_centers_all on cost_centers
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on cost_centers to authenticated;

alter table mouvement_cost_centers enable row level security;
alter table mouvement_cost_centers force row level security;
drop policy if exists mouvement_cost_centers_all on mouvement_cost_centers;
create policy mouvement_cost_centers_all on mouvement_cost_centers
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on mouvement_cost_centers to authenticated;

-- Optional default cost centers
insert into cost_centers (id, mama_id, nom)
select '00000000-0000-0000-0000-000000009001', id, 'Food'
from mamas where not exists (
  select 1 from cost_centers where mama_id = mamas.id and nom = 'Food'
);
insert into cost_centers (id, mama_id, nom)
select '00000000-0000-0000-0000-000000009002', id, 'Beverage'
from mamas where not exists (
  select 1 from cost_centers where mama_id = mamas.id and nom = 'Beverage'
);

-- Table for audit logs
create table if not exists user_logs (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    user_id uuid references users(id) on delete set null,
    action text not null,
    details jsonb,
    done_by uuid references users(id) on delete set null,
    created_at timestamptz default now()
);

create index if not exists idx_user_logs_mama on user_logs(mama_id);
create index if not exists idx_user_logs_user on user_logs(user_id);
create index if not exists idx_user_logs_done on user_logs(done_by);
create index if not exists idx_user_logs_date on user_logs(created_at);

alter table user_logs enable row level security;
alter table user_logs force row level security;
drop policy if exists user_logs_all on user_logs;
create policy user_logs_all on user_logs
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on user_logs to authenticated;

-- View summarising cost center consumption
create view if not exists v_cost_center_totals as
select
  c.mama_id,
  c.id as cost_center_id,
  c.nom,
  coalesce(sum(m.quantite),0) as quantite_totale,
  coalesce(sum(m.valeur),0) as valeur_totale
from cost_centers c
left join mouvement_cost_centers m on m.cost_center_id = c.id
group by c.mama_id, c.id, c.nom;
grant select on v_cost_center_totals to authenticated;

-- View summarising cost center consumption per month
create view if not exists v_cost_center_monthly as
select
  c.mama_id,
  c.id as cost_center_id,
  date_trunc('month', m.created_at) as mois,
  c.nom,
  coalesce(sum(m.quantite),0) as quantite,
  coalesce(sum(m.valeur),0) as valeur
from cost_centers c
left join mouvement_cost_centers m on m.cost_center_id = c.id
group by c.mama_id, c.id, mois, c.nom;
grant select on v_cost_center_monthly to authenticated;

-- Function returning stats per cost center for a date range
create or replace function stats_cost_centers(mama_id_param uuid, debut_param date default null, fin_param date default null)
returns table(cost_center_id uuid, nom text, quantite numeric, valeur numeric)
language plpgsql security definer as $$
begin
  return query
    select c.id, c.nom, sum(coalesce(m.quantite,0)), sum(coalesce(m.valeur,0))
    from cost_centers c
    left join mouvement_cost_centers m on m.cost_center_id = c.id
      and (debut_param is null or m.created_at >= debut_param)
      and (fin_param is null or m.created_at < fin_param + interval '1 day')
    where c.mama_id = mama_id_param
    group by c.id, c.nom;
end;
$$;
grant execute on function stats_cost_centers(uuid, date, date) to authenticated;

-- Trigger function to log cost center changes
create or replace function log_cost_centers_changes()
returns trigger language plpgsql as $$
begin
  insert into user_logs(mama_id, user_id, action, details, done_by)
  values(
    coalesce(new.mama_id, old.mama_id),
    auth.uid(),
    'cost_centers ' || tg_op,
    jsonb_build_object('id_old', old.id, 'id_new', new.id, 'nom_old', old.nom, 'nom_new', new.nom),
    auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists trg_log_cost_centers on cost_centers;
create trigger trg_log_cost_centers
after insert or update or delete on cost_centers
for each row execute function log_cost_centers_changes();

-- Trigger function to log mouvement cost center allocations
create or replace function log_mouvement_cc_changes()
returns trigger language plpgsql as $$
begin
  insert into user_logs(mama_id, user_id, action, details, done_by)
  values(
    coalesce(new.mama_id, old.mama_id),
    auth.uid(),
    'mouvement_cost_centers ' || tg_op,
    jsonb_build_object('mouvement_id', coalesce(new.mouvement_id, old.mouvement_id)),
    auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists trg_log_mouvement_cc on mouvement_cost_centers;
create trigger trg_log_mouvement_cc
after insert or update or delete on mouvement_cost_centers
for each row execute function log_mouvement_cc_changes();

-- View of suppliers with no invoices in the last 6 months
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

-- Table for product losses (pertes)
create table if not exists pertes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    cost_center_id uuid references cost_centers(id),
    date_perte date not null default current_date,
    quantite numeric not null,
    motif text,
    created_at timestamptz default now(),
    created_by uuid references users(id)
);
create index if not exists idx_pertes_mama on pertes(mama_id);
create index if not exists idx_pertes_product on pertes(product_id);

-- RLS for pertes
alter table pertes enable row level security;
alter table pertes force row level security;
drop policy if exists pertes_all on pertes;
create policy pertes_all on pertes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on pertes to authenticated;


-- Trigger logging pertes
create or replace function log_pertes_changes()
returns trigger language plpgsql as $$
begin
  insert into user_logs(mama_id, user_id, action, details, done_by)
  values(new.mama_id, auth.uid(), 'pertes ' || tg_op,
         jsonb_build_object('id', new.id, 'product_id', new.product_id),
         auth.uid());
  return new;
end;
$$;
drop trigger if exists trg_log_pertes on pertes;
create trigger trg_log_pertes
after insert or update or delete on pertes
for each row execute function log_pertes_changes();


-- Function suggesting cost center allocations based on historical data
create or replace function suggest_cost_centers(p_product_id uuid)
returns table(cost_center_id uuid, nom text, ratio numeric)
language sql stable security definer as $$
  select
    mcc.cost_center_id,
    cc.nom,
    sum(mcc.quantite)::numeric / greatest(sum(sum_mcc.quantite),1) as ratio
  from mouvement_cost_centers mcc
  join mouvements_stock ms on ms.id = mcc.mouvement_id
  join cost_centers cc on cc.id = mcc.cost_center_id
  join (
    select sum(abs(m.quantite)) as quantite
    from mouvements_stock m
    where m.product_id = p_product_id
      and m.mama_id = current_user_mama_id()
      and m.quantite < 0
  ) sum_mcc on true
  where ms.product_id = p_product_id
    and ms.mama_id = current_user_mama_id()
    and ms.quantite < 0
  group by mcc.cost_center_id, cc.nom;
$$;
grant execute on function suggest_cost_centers(uuid) to authenticated;

-- View of monthly average purchase price per product
create or replace view v_product_price_trend as
select
  fl.mama_id,
  fl.product_id,
  date_trunc('month', f.date) as mois,
  avg(fl.prix_unitaire) as prix_moyen
from facture_lignes fl
  join factures f on f.id = fl.facture_id
  group by fl.mama_id, fl.product_id, mois;
grant select on v_product_price_trend to authenticated;


-- 2FA columns for users
alter table users
  add column if not exists two_fa_enabled boolean default false,
  add column if not exists two_fa_secret text;
comment on column users.two_fa_enabled is 'Whether TOTP 2FA is enabled';
comment on column users.two_fa_secret is 'TOTP secret for 2FA';

-- Allow users to enable/disable 2FA
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
-- Function returning top consumed products for a date range
create or replace function top_products(
  mama_id_param uuid,
  debut_param date default null,
  fin_param date default null,
  limit_param integer default 5
)
returns table(product_id uuid, nom text, total numeric)
language sql stable security definer as $$
  select p.id, p.nom, sum(abs(m.quantite)) as total
  from mouvements_stock m
  join products p on p.id = m.product_id
  where m.mama_id = mama_id_param
    and m.quantite < 0
    and (debut_param is null or m.created_at >= debut_param)
    and (fin_param is null or m.created_at < fin_param + interval '1 day')
  group by p.id, p.nom
  order by total desc
  limit limit_param
$$;

-- Movements lacking cost center allocations
create or replace function mouvements_without_alloc(limit_param integer default 100)
returns table(id uuid, product_id uuid, quantite numeric, valeur numeric, created_at timestamptz, mama_id uuid)
language sql stable security definer as $$
  select m.id, m.product_id, m.quantite, m.valeur, m.created_at, m.mama_id
  from mouvements_stock m
  where m.mama_id = current_user_mama_id()
    and m.quantite < 0
    and not exists (
      select 1 from mouvement_cost_centers mc where mc.mouvement_id = m.id
    )
  order by m.created_at
  limit limit_param;
$$;

-- Index for user login by email
create index if not exists idx_users_email on users(email);

-- Optional famille/unite text columns for products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='famille'
  ) THEN
    ALTER TABLE products ADD COLUMN famille text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='unite'
  ) THEN
    ALTER TABLE products ADD COLUMN unite text;
  END IF;
END $$;

-- ---------------------------------------
-- Module Carte - additional fields
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

-- Audit table for price changes
create table if not exists fiche_prix_history (
    id uuid primary key default uuid_generate_v4(),
    fiche_id uuid references fiches_techniques(id) on delete cascade,
    old_prix numeric,
    new_prix numeric,
    changed_by uuid references users(id),
    mama_id uuid not null references mamas(id),
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

-- Indexes for optional movement columns
create index if not exists idx_mouvements_stock_sous_type on mouvements_stock(sous_type);
create index if not exists idx_mouvements_stock_zone on mouvements_stock(zone);
create index if not exists idx_mouvements_stock_motif on mouvements_stock(motif);

-- Indexes to speed up movement queries
create index if not exists idx_mouvements_stock_mama on mouvements_stock(mama_id);
create index if not exists idx_mouvements_stock_product on mouvements_stock(product_id);
create index if not exists idx_mouvements_stock_date on mouvements_stock(date);
create index if not exists idx_mouvements_stock_type on mouvements_stock(type);

-- Add starting date column for inventaires
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

create index if not exists idx_products_famille_txt on products(famille);
create index if not exists idx_products_unite_txt on products(unite);
create index if not exists idx_products_code on products(code);
create index if not exists idx_fournisseurs_nom on fournisseurs(nom);

-- Dashboard stats function
create or replace function dashboard_stats(
  mama_id_param uuid,
  page_param integer default 1,
  page_size_param integer default 30
)
returns table(product_id uuid, nom text, stock_reel numeric, pmp numeric, last_purchase timestamptz)
language sql stable security definer as $$
  select p.id, p.nom, p.stock_reel, p.pmp, max(f.date) as last_purchase
  from products p
  left join facture_lignes fl on fl.product_id = p.id
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
    type text not null check (type in ('unique','quotidienne','hebdomadaire','mensuelle')),
    date_debut date not null,
    date_fin date,
    next_echeance date,
    assigned_to uuid references users(id),
    statut text not null default 'a_faire' check (statut in ('a_faire','en_cours','fait','reporte','annule')),
    created_at timestamptz default now()
);
create index if not exists idx_taches_mama on taches(mama_id);
create index if not exists idx_taches_assigned on taches(assigned_to);
create index if not exists idx_taches_echeance on taches(next_echeance);
create index if not exists idx_taches_statut on taches(statut);
create index if not exists idx_taches_debut on taches(date_debut);
create index if not exists idx_taches_fin on taches(date_fin);

alter table taches enable row level security;
alter table taches force row level security;
drop policy if exists taches_all on taches;
create policy taches_all on taches
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
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

-- Grant execution of helper functions
grant execute on function dashboard_stats(uuid, integer, integer) to authenticated;
grant execute on function top_products(uuid, date, date, integer) to authenticated;
grant execute on function mouvements_without_alloc(integer) to authenticated;

-- Index to speed up invoice search
create index if not exists idx_factures_reference on factures(reference);

-- Table mapping suppliers to products with purchase history
create table if not exists supplier_products (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references products(id) on delete cascade,
    fournisseur_id uuid references fournisseurs(id) on delete cascade,
    mama_id uuid not null references mamas(id) on delete cascade,
    prix_achat numeric,
    date_livraison date,
    updated_at timestamptz default now()
);
create index if not exists idx_supplier_products_product on supplier_products(product_id);
create index if not exists idx_supplier_products_fournisseur on supplier_products(fournisseur_id);
create index if not exists idx_supplier_products_mama on supplier_products(mama_id);
create index if not exists idx_supplier_products_livraison on supplier_products(date_livraison);

alter table supplier_products enable row level security;
alter table supplier_products force row level security;
drop policy if exists supplier_products_all on supplier_products;
create policy supplier_products_all on supplier_products
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on supplier_products to authenticated;

-- Optional columns for mouvements_stock to store details
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

-- Menu engineering sales table
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


-- Module Promotions / Operations commerciales

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

create table if not exists promotion_products (
    id uuid primary key default uuid_generate_v4(),
    promotion_id uuid references promotions(id) on delete cascade,
    product_id uuid references products(id) on delete cascade,
    discount numeric,
    prix_promo numeric,
    mama_id uuid not null references mamas(id),
    created_at timestamptz default now(),
    unique (promotion_id, product_id)
);

create index if not exists idx_promotions_mama on promotions(mama_id);
create index if not exists idx_promotions_actif on promotions(actif);
create index if not exists idx_promo_prod_mama on promotion_products(mama_id);
create index if not exists idx_promo_prod_promotion on promotion_products(promotion_id);
create index if not exists idx_promo_prod_product on promotion_products(product_id);

alter table promotions enable row level security;
alter table promotions force row level security;
drop policy if exists promotions_all on promotions;
create policy promotions_all on promotions
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on promotions to authenticated;

alter table promotion_products enable row level security;
alter table promotion_products force row level security;
drop policy if exists promotion_products_all on promotion_products;
create policy promotion_products_all on promotion_products
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on promotion_products to authenticated;

create or replace function log_promotions_changes()
returns trigger language plpgsql as $$
begin
  insert into user_logs(mama_id, user_id, action, details, done_by)
  values(coalesce(new.mama_id, old.mama_id), auth.uid(), 'promotions ' || tg_op,
         jsonb_build_object('id_new', new.id, 'id_old', old.id), auth.uid());
  return new;
end;
$$;

drop trigger if exists trg_log_promotions on promotions;
create trigger trg_log_promotions
after insert or update or delete on promotions
for each row execute function log_promotions_changes();

-- View and function for consolidated multi-site stats
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
left join products p on p.mama_id = m.id
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
    select role from users where id = auth.uid()
  ) = 'superadmin' or mama_id = current_user_mama_id();
$$;

grant execute on function consolidated_stats() to authenticated;

-- Advanced audit trail for legal compliance
create table if not exists audit_entries (
    id serial primary key,
    mama_id uuid not null references mamas(id) on delete cascade,
    table_name text not null,
    row_id uuid,
    operation text not null,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid references users(id) on delete set null,
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

drop trigger if exists trg_audit_products on products;
create trigger trg_audit_products
after insert or update or delete on products
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
    product_id uuid references products(id) on delete cascade,
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
    product_id uuid references products(id) on delete cascade,
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
      and (product_id is null or product_id = new.id)
  loop
    if new.stock_reel < r.threshold then
      insert into alert_logs(rule_id, mama_id, product_id, stock_reel)
        values (r.id, new.mama_id, new.id, new.stock_reel);
    end if;
  end loop;
  return new;
end;
$$;

grant execute on function check_stock_alert() to authenticated;

drop trigger if exists trg_stock_alert on products;
create trigger trg_stock_alert
after update of stock_reel on products
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
  insert into facture_lignes(facture_id, product_id, quantite, prix_unitaire, mama_id)
  select fac_id, p.id, (l->>'quantity')::numeric, (l->>'unit_price')::numeric, current_user_mama_id()
  from jsonb_array_elements(payload->'lines') as l
  left join products p on p.code = l->>'product_code' and p.mama_id = current_user_mama_id();
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
create or replace function current_user_role()
returns text language sql stable security definer as $$
  select r.nom from users u join roles r on r.id = u.role_id where u.id = auth.uid();
$$;
grant execute on function current_user_role() to authenticated;

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

-- Signalements / Issue reporting
create table if not exists signalements (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    titre text not null,
    commentaire text,
    statut text default 'ouvert',
    date timestamptz default now(),
    created_by uuid references users(id) on delete set null,
    created_at timestamptz default now()
);
create index if not exists idx_signalements_mama on signalements(mama_id);
alter table signalements enable row level security;
alter table signalements force row level security;
drop policy if exists signalements_all on signalements;
create policy signalements_all on signalements
  for all to authenticated
  using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on signalements to authenticated;

-- Extend requisitions table with tracking columns
alter table requisitions add column if not exists produit_id uuid references products(id) on delete set null;
alter table requisitions add column if not exists quantite numeric;
alter table requisitions add column if not exists motif text;
alter table requisitions add column if not exists date_requisition date default current_date;
alter table requisitions add column if not exists created_by uuid references users(id) on delete set null;
