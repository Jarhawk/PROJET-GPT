# Import e-factures

La fonctionnalité d'import permet de déposer des factures fournisseurs au format JSON ou UBL.

## Table `incoming_invoices`
```sql
create table if not exists incoming_invoices (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references mamas(id),
  user_id uuid references utilisateurs(id),
  payload jsonb,
  processed boolean default false,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_incoming_invoices_mama_id on incoming_invoices(mama_id);
create index if not exists idx_incoming_invoices_processed on incoming_invoices(processed);
create index if not exists idx_incoming_invoices_actif on incoming_invoices(actif);
create index if not exists idx_incoming_invoices_updated on incoming_invoices(updated_at);
```
Les policies RLS limitent l'accès aux utilisateurs de la même structure :
```sql
alter table incoming_invoices enable row level security;
alter table incoming_invoices force row level security;
drop policy if exists incoming_invoices_all on incoming_invoices;
create policy incoming_invoices_all on incoming_invoices
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- mise à jour automatique
create trigger if not exists trg_set_updated_at_incoming
  before update on incoming_invoices
  for each row execute procedure set_updated_at();
```

## Fonction `import_invoice`
```sql
create or replace function import_invoice(payload jsonb)
returns uuid ...
```
Cette fonction enregistre le fichier dans `incoming_invoices` puis crée les enregistrements dans `factures` et `facture_lignes`.

## Page `/factures/import`
La page propose un formulaire d'upload et appelle le hook `useInvoiceImport` qui se charge d'envoyer le fichier au RPC `import_invoice`.
L'accès est protégé par le droit `factures` et le lien est visible uniquement pour les utilisateurs autorisés.
