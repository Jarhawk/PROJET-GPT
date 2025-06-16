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
create index if not exists idx_mouvement_cc_mama on mouvement_cost_centers(mama_id);
create index if not exists idx_mouvement_cc_mouvement on mouvement_cost_centers(mouvement_id);
create index if not exists idx_mouvement_cc_cc on mouvement_cost_centers(cost_center_id);

-- Row level security policies
alter table cost_centers enable row level security;
alter table cost_centers force row level security;
create policy cost_centers_all on cost_centers
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table mouvement_cost_centers enable row level security;
alter table mouvement_cost_centers force row level security;
create policy mouvement_cost_centers_all on mouvement_cost_centers
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

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

-- Table for product losses (pertes)
create table if not exists pertes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    product_id uuid not null references produits(id) on delete cascade,
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
  join produits p on p.id = m.product_id
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


-- View summarising purchase totals per supplier
create or replace view v_fournisseur_totaux as
select
  f.mama_id,
  f.id as fournisseur_id,
  f.nom,
  count(fc.id) as nb_factures,
  coalesce(sum(fc.montant),0) as total_achats,
  max(fc.date) as last_invoice_date
from fournisseurs f
left join factures fc on fc.fournisseur_id = f.id
where f.mama_id is not null
group by f.mama_id, f.id, f.nom;
