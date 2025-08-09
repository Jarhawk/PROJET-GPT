-- Menu du jour module

-- Table des menus par jour
create table if not exists menus_jour (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id) on delete cascade,
  date_menu date not null,
  titre text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (mama_id, date_menu)
);

-- Lignes de menu (fiches techniques)
create table if not exists menus_jour_lignes (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus_jour(id) on delete cascade,
  mama_id uuid not null,
  categorie text not null check (categorie in ('entree','plat','dessert','boisson')),
  fiche_id uuid not null references fiches_techniques(id) on delete restrict,
  portions numeric not null default 1,
  prix_unitaire_snapshot numeric,
  created_at timestamptz default now()
);

-- Favoris pour rechargement rapide
create table if not exists menus_favoris (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id) on delete cascade,
  nom text not null,
  categorie text check (categorie in ('entree','plat','dessert','boisson')),
  fiche_id uuid not null references fiches_techniques(id) on delete restrict,
  portions_default numeric default 1,
  actif boolean default true,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_menus_jour_mama_date on menus_jour(mama_id, date_menu);
create index if not exists idx_menus_jour_lignes_menu on menus_jour_lignes(menu_id);
create index if not exists idx_menus_jour_lignes_fiche on menus_jour_lignes(fiche_id);

-- Enable RLS
alter table menus_jour enable row level security;
alter table menus_jour_lignes enable row level security;
alter table menus_favoris enable row level security;

-- Policies
create policy menus_jour_all on menus_jour
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create policy menus_jour_lignes_all on menus_jour_lignes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create policy menus_favoris_all on menus_favoris
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Grants
grant select, insert, update, delete on menus_jour, menus_jour_lignes, menus_favoris to authenticated;

-- Views de coûts
create or replace view v_menu_du_jour_lignes_cout as
select
  l.id,
  l.menu_id,
  l.mama_id,
  l.categorie,
  l.fiche_id,
  l.portions,
  cf.cout as cout_total_fiche,
  cf.portions as portions_fiche,
  (cf.cout / nullif(cf.portions,0)) as cout_par_portion,
  ((cf.cout / nullif(cf.portions,0)) * l.portions) as cout_ligne_total
from menus_jour_lignes l
join v_couts_fiches cf on cf.fiche_id = l.fiche_id
where l.mama_id = cf.mama_id;

create or replace view v_menu_du_jour_resume as
with lignes as (
  select menu_id, categorie, sum(cout_ligne_total) as cout_categorie
  from v_menu_du_jour_lignes_cout
  group by menu_id, categorie
)
select
  m.id as menu_id,
  m.mama_id,
  m.date_menu,
  coalesce(sum(l.cout_categorie) filter (where l.categorie='entree'),0) as cout_entrees,
  coalesce(sum(l.cout_categorie) filter (where l.categorie='plat'),0) as cout_plats,
  coalesce(sum(l.cout_categorie) filter (where l.categorie='dessert'),0) as cout_desserts,
  coalesce(sum(l.cout_categorie) filter (where l.categorie='boisson'),0) as cout_boissons,
  coalesce(sum(l.cout_categorie),0) as cout_total
from menus_jour m
left join lignes l on l.menu_id = m.id
group by m.id, m.mama_id, m.date_menu;

create or replace view v_menu_du_jour_mensuel as
select
  mama_id,
  date_trunc('month', date_menu)::date as mois,
  sum(cout_total) as cout_total_mois
from v_menu_du_jour_resume
group by mama_id, date_trunc('month', date_menu);

