# Validation des actions

La table `validation_requests` conserve les actions sensibles à approuver avant exécution.

```sql
create table if not exists validation_requests (
  id uuid primary key default gen_random_uuid(),
  action_type text,
  table_cible text,
  element_id uuid,
  statut text,
  demandeur_id uuid references utilisateurs(id),
  valideur_id uuid references utilisateurs(id),
  commentaire text,
  date_demande timestamptz default now(),
  date_validation timestamptz,
  mama_id uuid references mamas(id),
  actif boolean default true,
  updated_at timestamptz default now()
);
create index if not exists idx_validation_requests_mama_id on validation_requests(mama_id);
create index if not exists idx_validation_requests_actif on validation_requests(actif);
create index if not exists idx_validation_requests_updated on validation_requests(updated_at);
```

Les politiques RLS limitent l'accès aux utilisateurs de la même `mama` :

```sql
alter table validation_requests enable row level security;
alter table validation_requests force row level security;
drop policy if exists validation_requests_all on validation_requests;
create policy validation_requests_all on validation_requests
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
```

Le hook `useValidations` gère la récupération et la mise à jour des demandes via Supabase.
