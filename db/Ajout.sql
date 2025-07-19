-- Mise à niveau du schéma pour correspondre au front-end

-- Table documents : ajout des colonnes manquantes
alter table if exists documents
  add column if not exists nom text,
  add column if not exists url text,
  add column if not exists taille numeric,
  add column if not exists categorie text,
  add column if not exists entite_liee_type text,
  add column if not exists entite_liee_id uuid,
  add column if not exists uploaded_by uuid references utilisateurs(id),
  add column if not exists actif boolean default true;

update documents
  set url = coalesce(url, chemin),
      nom = coalesce(nom, split_part(coalesce(url, chemin), '/', -1));

-- Table help_articles : aucune modification necessaire, on conserve
-- les colonnes `titre` et `contenu` deja utilisees par le front-end

-- Table mamas : ajout des colonnes de parametrage utilisees par le front
alter table if exists mamas
  add column if not exists logo_url text,
  add column if not exists primary_color text,
  add column if not exists secondary_color text,
  add column if not exists email_envoi text,
  add column if not exists email_alertes text,
  add column if not exists dark_mode boolean default false,
  add column if not exists langue text,
  add column if not exists monnaie text,
  add column if not exists timezone text,
  add column if not exists rgpd_text text,
  add column if not exists mentions_legales text;

-- Colonnes de base attendues par le front
alter table if exists mamas
  add column if not exists nom text,
  add column if not exists ville text,
  add column if not exists email text,
  add column if not exists telephone text;

-- Table fournisseurs : alignement avec les formulaires du front
alter table if exists fournisseurs
  add column if not exists ville text,
  add column if not exists tel text,
  add column if not exists contact text;

-- Table feedback : alignement avec les besoins du front
alter table if exists feedback
  add column if not exists actif boolean default true,
  add column if not exists updated_at timestamp with time zone default now();

create index if not exists idx_feedback_actif on feedback(actif);
create index if not exists idx_feedback_updated_at on feedback(updated_at);
alter table if exists feedback enable row level security;
alter table if exists feedback force row level security;
drop policy if exists feedback_all on feedback;
create policy feedback_all on feedback
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Table fiches_techniques : alignement avec le front
alter table if exists fiches_techniques
  add column if not exists nom text,
  add column if not exists famille_id uuid references familles(id),
  add column if not exists portions numeric default 1,
  add column if not exists rendement numeric,
  add column if not exists prix_vente numeric,
  add column if not exists carte_actuelle boolean default false,
  add column if not exists type_carte text,
  add column if not exists sous_type_carte text,
  add column if not exists cout_total numeric,
  add column if not exists cout_par_portion numeric;

-- Table planning_previsionnel : alignement avec le front
alter table if exists planning_previsionnel
  add column if not exists notes text,
  add column if not exists actif boolean default true,
  add column if not exists updated_at timestamp with time zone default now();

create index if not exists idx_planning_previsionnel_actif on planning_previsionnel(actif);
create index if not exists idx_planning_previsionnel_date on planning_previsionnel(date_prevue);
create index if not exists idx_planning_previsionnel_updated on planning_previsionnel(updated_at);
alter table if exists planning_previsionnel enable row level security;
alter table if exists planning_previsionnel force row level security;
drop policy if exists planning_previsionnel_all on planning_previsionnel;
create policy planning_previsionnel_all on planning_previsionnel
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Mise à jour automatique de updated_at
create trigger if not exists trg_set_updated_at_feedback
  before update on feedback
  for each row execute procedure set_updated_at();

create trigger if not exists trg_set_updated_at_planning
  before update on planning_previsionnel
  for each row execute procedure set_updated_at();

-- Table validation_requests : alignement avec le front
alter table if exists validation_requests
  add column if not exists actif boolean default true,
  add column if not exists updated_at timestamp with time zone default now();

create index if not exists idx_validation_requests_actif on validation_requests(actif);
create index if not exists idx_validation_requests_updated on validation_requests(updated_at);
alter table if exists validation_requests enable row level security;
alter table if exists validation_requests force row level security;
drop policy if exists validation_requests_all on validation_requests;
create policy validation_requests_all on validation_requests
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create trigger if not exists trg_set_updated_at_validation
  before update on validation_requests
  for each row execute procedure set_updated_at();

-- Table incoming_invoices pour l'import des e-factures
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
create trigger if not exists trg_set_updated_at_incoming
  before update on incoming_invoices
  for each row execute procedure set_updated_at();
alter table if exists incoming_invoices enable row level security;
alter table if exists incoming_invoices force row level security;
drop policy if exists incoming_invoices_all on incoming_invoices;
create policy incoming_invoices_all on incoming_invoices
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

grant insert on incoming_invoices to authenticated;

create or replace function import_invoice(payload jsonb)
returns uuid
language plpgsql
as $$
declare
  new_id uuid;
  f_id uuid;
  ligne jsonb;
begin
  insert into incoming_invoices (mama_id, user_id, payload)
  values (current_user_mama_id(), auth.uid(), payload)
  returning id into new_id;
  -- create invoice from payload if possible
  insert into factures (mama_id, fournisseur_id, numero, date_facture, actif)
    values (
      current_user_mama_id(),
      (payload->>'fournisseur_id')::uuid,
      payload->>'numero',
      (payload->>'date_facture')::date,
      true
    )
    returning id into f_id;

  for ligne in select * from jsonb_array_elements(coalesce(payload->'lignes', '[]'::jsonb)) loop
    insert into facture_lignes (mama_id, facture_id, produit_id, quantite, prix, actif)
    values (
      current_user_mama_id(),
      f_id,
      (ligne->>'produit_id')::uuid,
      (ligne->>'quantite')::numeric,
      (ligne->>'prix')::numeric,
      true
    );
  end loop;
  return new_id;
end;
$$;
grant execute on function import_invoice(payload jsonb) to authenticated;

-- Sécurité pour les modules utilisateurs et rôles
alter table if exists utilisateurs enable row level security;
alter table if exists utilisateurs force row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'utilisateurs'
      and policyname = 'utilisateurs_all'
  ) then
    create policy utilisateurs_all on utilisateurs
      for all using (mama_id = current_user_mama_id())
      with check (mama_id = current_user_mama_id());
  end if;
end$$;

alter table if exists roles enable row level security;
alter table if exists roles force row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'roles'
      and policyname = 'roles_all'
  ) then
    create policy roles_all on roles
      for all using (mama_id = current_user_mama_id())
      with check (mama_id = current_user_mama_id());
  end if;
end$$;

grant select, insert, update on table utilisateurs to authenticated;
grant select, insert, update on table roles to authenticated;

-- RLS pour la table fournisseurs_api_config
alter table if exists fournisseurs_api_config enable row level security;
alter table if exists fournisseurs_api_config force row level security;
drop policy if exists fournisseurs_api_config_all on fournisseurs_api_config;
create policy fournisseurs_api_config_all on fournisseurs_api_config
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
