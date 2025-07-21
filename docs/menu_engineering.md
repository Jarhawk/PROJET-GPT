# Menu Engineering

Ce module permet d'analyser la performance des fiches à la carte.

## Table `ventes_fiches_carte`

```sql
create table if not exists ventes_fiches_carte (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references mamas(id),
  fiche_id uuid references fiches_techniques(id),
  periode date,
  ventes integer,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_ventes_fiches_carte_mama_id on ventes_fiches_carte(mama_id);
create index if not exists idx_ventes_fiches_carte_periode on ventes_fiches_carte(periode);
```

La politique RLS filtre sur `mama_id` pour garantir que chaque établissement accède uniquement à ses données :

```sql
alter table ventes_fiches_carte enable row level security;
alter table ventes_fiches_carte force row level security;
create policy ventes_fiches_carte_all on ventes_fiches_carte
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
```

## Vue analytique

```sql
create or replace view v_menu_engineering as
select f.id as fiche_id,
       f.nom,
       f.famille,
       f.prix_vente,
       coalesce(f.cout_par_portion, 0) as cout_portion,
       v.periode,
       coalesce(v.ventes, 0) as ventes,
       round(coalesce(v.ventes,0)::numeric /
             nullif(sum(v.ventes) over(partition by f.mama_id, v.periode),0), 4) as popularite,
       round(100 * (f.prix_vente - coalesce(f.cout_par_portion,0)) /
             nullif(f.prix_vente,0), 2) as marge,
       f.mama_id
from fiches_techniques f
left join ventes_fiches_carte v
  on v.fiche_id = f.id and v.mama_id = f.mama_id
where f.actif = true;
```

## Calculs

Le hook `useMenuEngineering` calcule pour chaque fiche le food cost, la marge et la popularité avant de lui attribuer un classement (Star, Plow Horse, Puzzle ou Dog). Les ventes sont saisies mensuellement via la page `/menu-engineering`.
