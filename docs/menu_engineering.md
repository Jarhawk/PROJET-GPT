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

## Calculs

Le hook `useMenuEngineering` calcule pour chaque fiche le food cost, la marge et la popularité avant de lui attribuer un classement (Star, Plow Horse, Puzzle ou Dog). Les ventes sont saisies mensuellement via la page `/menu-engineering`.
