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
create policy cost_centers_all on cost_centers
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on cost_centers to authenticated;

alter table mouvement_cost_centers enable row level security;
alter table mouvement_cost_centers force row level security;
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
