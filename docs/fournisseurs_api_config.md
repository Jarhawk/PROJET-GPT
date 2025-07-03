# Module API fournisseurs

Ce module permet de configurer les paramètres d'accès aux API des fournisseurs.
Chaque fournisseur peut avoir une configuration propre contenant l'URL, le type
d'API et un token d'accès. La table `fournisseurs_api_config` est protégée par
RLS et utilise la clé primaire composée `(fournisseur_id, mama_id)`.

```sql
create table if not exists fournisseurs_api_config (
  fournisseur_id uuid references fournisseurs(id) on delete cascade,
  mama_id uuid not null references mamas(id),
  url text,
  type_api text default 'rest',
  token text,
  format_facture text default 'json',
  actif boolean default true,
  created_at timestamptz default now(),
  primary key(fournisseur_id, mama_id)
);
create index if not exists idx_fournisseurs_api_config_fournisseur_id
  on fournisseurs_api_config(fournisseur_id);
create index if not exists idx_fournisseurs_api_config_mama_id
  on fournisseurs_api_config(mama_id);
```

Les politiques RLS garantissent que chaque utilisateur n'accède qu'aux données
de sa structure :

```sql
alter table fournisseurs_api_config enable row level security;
alter table fournisseurs_api_config force row level security;
create policy fournisseurs_api_config_all on fournisseurs_api_config
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
```

Côté front, le hook `useFournisseurApiConfig` permet de charger, enregistrer ou
supprimer la configuration via Supabase JS. Il expose aussi `listConfigs` pour
rechercher et paginer les entrées par fournisseur et statut. Le formulaire
`FournisseurApiSettingsForm` s'appuie sur ce hook et pré‑remplit la configuration
existante.
