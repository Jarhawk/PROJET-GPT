# Planning prévisionnel

Ce module permet de planifier les besoins futurs pour chaque établissement.

## Table `planning_previsionnel`

```sql
create table if not exists planning_previsionnel (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references mamas(id),
  date_prevue date,
  notes text,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_planning_previsionnel_mama_id on planning_previsionnel(mama_id);
create index if not exists idx_planning_previsionnel_date on planning_previsionnel(date_prevue);
create index if not exists idx_planning_previsionnel_actif on planning_previsionnel(actif);
create index if not exists idx_planning_previsionnel_updated on planning_previsionnel(updated_at);
```

La politique RLS restreint l'accès aux données de la `mama` courante :

```sql
alter table planning_previsionnel enable row level security;
alter table planning_previsionnel force row level security;
drop policy if exists planning_previsionnel_all on planning_previsionnel;
create policy planning_previsionnel_all on planning_previsionnel
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
```

## Fonctionnement du module

La page `/planning` affiche la liste des entrées triées par date et propose un formulaire d'ajout.
Les opérations passent par le hook `usePlanning` qui filtre automatiquement sur `mama_id` et `actif`.
