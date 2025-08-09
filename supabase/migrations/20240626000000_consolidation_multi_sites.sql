-- Multi-site consolidation module

-- Table mapping user to mamas they can access
create table if not exists user_mama_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mama_id uuid not null references mamas(id) on delete cascade,
  role text default 'viewer' check (role in ('viewer','manager','admin')),
  created_at timestamptz default now(),
  unique (user_id, mama_id)
);

-- Row level security so each user only sees his mappings and only admins can manage
alter table user_mama_access enable row level security;

create policy uma_self_select on user_mama_access
for select using (user_id = auth.uid());

create policy uma_admin_insert on user_mama_access
for insert with check (current_user_is_admin());

create policy uma_admin_update on user_mama_access
for update using (current_user_is_admin());

create policy uma_admin_delete on user_mama_access
for delete using (current_user_is_admin());

grant select, insert, update, delete on user_mama_access to authenticated;

-- helper returning all mamas accessible by the current user
create or replace function accessible_mamas()
returns setof uuid
language sql stable security definer
as $$
  select mama_id
  from user_mama_access
  where user_id = auth.uid()
$$;

-- check if user can access a mama
create or replace function can_access_mama(mid uuid)
returns boolean
language sql stable security definer
as $$
  select exists(
    select 1 from user_mama_access
    where user_id = auth.uid() and mama_id = mid
  )
$$;

-- Monthly purchases per mama
create or replace view v_cons_achats_mensuels as
select
  cl.mama_id,
  date_trunc('month', c.date_commande)::date as mois,
  sum(coalesce(cl.quantite,0) * coalesce(cl.prix_achat,0)) as achats_total
from commande_lignes cl
join commandes c on c.id = cl.commande_id and c.mama_id = cl.mama_id
where cl.mama_id = any (array(select accessible_mamas()))
group by cl.mama_id, date_trunc('month', c.date_commande);

-- Monthly sales per mama
create or replace view v_cons_ventes_mensuelles as
select
  vf.mama_id,
  date_trunc('month', vf.date_vente)::date as mois,
  sum(coalesce(vf.quantite,0) * coalesce(nullif(vf.prix_vente_unitaire,0), 0)) as ca_total,
  sum(coalesce(vf.quantite,0)) as ventes_total
from ventes_fiches vf
where vf.mama_id = any (array(select accessible_mamas()))
group by vf.mama_id, date_trunc('month', vf.date_vente);

-- Food cost menus monthly
create or replace view v_cons_foodcost_mensuel as
select
  v.mama_id,
  v.mois,
  v.cout_total_mois
from v_menu_du_jour_mensuel v
where v.mama_id = any (array(select accessible_mamas()));

-- Average margin on menu items
create or replace view v_cons_marge_carte as
select
  vc.mama_id,
  avg(vc.marge_pct) filter (where vc.marge_pct is not null and vc.actif) as marge_pct_moy
from v_costing_carte vc
where vc.mama_id = any (array(select accessible_mamas()))
group by vc.mama_id;

-- Inventory gaps per month
create or replace view v_cons_ecarts_inventaire as
select
  e.mama_id,
  date_trunc('month', e.date_inventaire)::date as mois,
  sum(abs(coalesce(e.ecart_valorise,0))) as ecart_valorise_total
from v_ecarts_inventaire e
where e.mama_id = any (array(select accessible_mamas()))
group by e.mama_id, date_trunc('month', e.date_inventaire);

-- Monthly consolidated view
create or replace view v_consolidation_mensuelle as
with a as (
  select * from v_cons_achats_mensuels
),
v as (
  select * from v_cons_ventes_mensuelles
),
f as (
  select * from v_cons_foodcost_mensuel
),
m as (
  select * from v_cons_marge_carte
),
i as (
  select * from v_cons_ecarts_inventaire
)
select
  mid.mama_id,
  mid.mois,
  coalesce(a.achats_total,0) as achats_total,
  coalesce(v.ca_total,0) as ca_total,
  coalesce(v.ventes_total,0) as ventes_total,
  coalesce(f.cout_total_mois,0) as menu_foodcost_total,
  m.marge_pct_moy,
  coalesce(i.ecart_valorise_total,0) as ecart_valorise_total
from (
  select mama_id, mois from v_cons_achats_mensuels
  union
  select mama_id, mois from v_cons_ventes_mensuelles
  union
  select mama_id, mois from v_cons_foodcost_mensuel
  union
  select mama_id, mois from v_cons_ecarts_inventaire
) mid
left join a on a.mama_id=mid.mama_id and a.mois=mid.mois
left join v on v.mama_id=mid.mama_id and v.mois=mid.mois
left join f on f.mama_id=mid.mama_id and f.mois=mid.mois
left join m on m.mama_id=mid.mama_id
left join i on i.mama_id=mid.mama_id and i.mois=mid.mois;

