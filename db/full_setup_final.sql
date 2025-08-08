-- ========================
-- 📦 EXTENSIONS
-- ========================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
-- ✅ OK

-- ========================
-- 🔧 FONCTIONS UTILITAIRES
-- ========================
create or replace function public.current_user_mama_id()
returns uuid
language sql stable as $$
  select u.mama_id from public.utilisateurs u where u.auth_id = auth.uid();
$$;
-- ✅ OK

-- ========================
-- 📋 TABLES
-- ========================
create table if not exists public.mamas (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fournisseurs (
  id uuid primary key default uuid_generate_v4(),
  mama_id uuid not null,
  nom text not null,
  contact text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.produits (
  id uuid primary key default uuid_generate_v4(),
  mama_id uuid not null,
  nom text not null,
  fournisseur_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  access_rights jsonb default '{}'::jsonb,
  actif boolean default true,
  mama_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.utilisateurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  auth_id uuid unique,
  role_id uuid,
  mama_id uuid not null,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.commandes (
  id uuid primary key default uuid_generate_v4(),
  mama_id uuid not null,
  fournisseur_id uuid,
  reference text,
  date_commande date default current_date,
  statut text default 'brouillon' check (statut in ('brouillon','validée','envoyée')),
  commentaire text,
  created_by uuid,
  validated_by uuid,
  envoyee_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  date_livraison_prevue date,
  montant_total numeric(12,2),
  bl_id uuid,
  facture_id uuid
);

create table if not exists public.commande_lignes (
  id uuid primary key default uuid_generate_v4(),
  commande_id uuid not null,
  produit_id uuid not null,
  quantite numeric,
  unite text,
  prix_achat numeric,
  total_ligne numeric generated always as (coalesce(quantite,0) * coalesce(prix_achat,0)) stored,
  suggestion boolean default false,
  commentaire text
);

create table if not exists public.templates_commandes (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  adresse_livraison text,
  pied_de_page text,
  champs_visibles jsonb default '{}'::jsonb,
  actif boolean default true,
  mama_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.emails_envoyes (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null,
  email text not null,
  statut text default 'en_attente',
  envoye_le timestamptz default now(),
  mama_id uuid not null
);
-- ✅ OK

-- ========================
-- 🔗 CLÉS ÉTRANGÈRES
-- ========================
alter table if exists public.fournisseurs
  add constraint fk_fournisseurs_mama_id foreign key (mama_id) references public.mamas(id) on delete cascade;

alter table if exists public.produits
  add constraint fk_produits_mama_id foreign key (mama_id) references public.mamas(id) on delete cascade,
  add constraint fk_produits_fournisseur_id foreign key (fournisseur_id) references public.fournisseurs(id) on delete set null;

alter table if exists public.roles
  add constraint fk_roles_mama_id foreign key (mama_id) references public.mamas(id) on delete cascade;

alter table if exists public.utilisateurs
  add constraint fk_utilisateurs_mama_id foreign key (mama_id) references public.mamas(id) on delete cascade,
  add constraint fk_utilisateurs_role_id foreign key (role_id) references public.roles(id) on delete restrict;

alter table if exists public.commandes
  add constraint fk_commandes_mama_id foreign key (mama_id) references public.mamas(id) on delete cascade,
  add constraint fk_commandes_fournisseur_id foreign key (fournisseur_id) references public.fournisseurs(id) on delete set null,
  add constraint fk_commandes_created_by foreign key (created_by) references public.utilisateurs(id) on delete set null,
  add constraint fk_commandes_bl_id foreign key (bl_id) references public.bons_livraison(id) on delete set null,
  add constraint fk_commandes_facture_id foreign key (facture_id) references public.factures(id) on delete set null;

alter table if exists public.commande_lignes
  add constraint fk_commande_lignes_commande_id foreign key (commande_id) references public.commandes(id) on delete cascade,
  add constraint fk_commande_lignes_produit_id foreign key (produit_id) references public.produits(id) on delete cascade;

alter table if exists public.templates_commandes
  add constraint fk_templates_commandes_mama_id foreign key (mama_id) references public.mamas(id) on delete cascade;

alter table if exists public.emails_envoyes
  add constraint fk_emails_envoyes_commande_id foreign key (commande_id) references public.commandes(id) on delete cascade,
  add constraint fk_emails_envoyes_mama_id foreign key (mama_id) references public.mamas(id) on delete cascade;
-- ✅ OK

-- ========================
-- ⚡ INDEX
-- ========================
create index if not exists idx_fournisseurs_mama_id on public.fournisseurs(mama_id);
create index if not exists idx_produits_mama_id on public.produits(mama_id);
create index if not exists idx_roles_mama_id on public.roles(mama_id);
create index if not exists idx_utilisateurs_mama_id on public.utilisateurs(mama_id);
create index if not exists idx_commandes_mama_id on public.commandes(mama_id);
create index if not exists idx_commandes_fournisseur_id on public.commandes(fournisseur_id);
create index if not exists idx_commande_lignes_commande_id on public.commande_lignes(commande_id);
create index if not exists idx_templates_commandes_mama on public.templates_commandes(mama_id);
create index if not exists idx_emails_envoyes_commande on public.emails_envoyes(commande_id);
-- ✅ OK

-- ========================
-- ⛓️ TRIGGERS
-- ========================
create or replace function public.update_timestamp_roles() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_roles_updated_at
before update on public.roles
for each row execute procedure public.update_timestamp_roles();

create or replace function public.update_timestamp_templates() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_templates_commandes_updated_at
before update on public.templates_commandes
for each row execute procedure public.update_timestamp_templates();
-- ✅ OK

-- ========================
-- 🛡️ RLS + POLICIES
-- ========================
alter table public.fournisseurs enable row level security;
create policy fournisseurs_all on public.fournisseurs
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on public.fournisseurs to authenticated;

alter table public.produits enable row level security;
create policy produits_all on public.produits
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on public.produits to authenticated;

alter table public.roles enable row level security;
create policy roles_all on public.roles
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on public.roles to authenticated;

alter table public.utilisateurs enable row level security;
create policy utilisateurs_all on public.utilisateurs
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on public.utilisateurs to authenticated;

alter table public.commandes enable row level security;
create policy commandes_all on public.commandes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on public.commandes to authenticated;

alter table public.commande_lignes enable row level security;
create policy commande_lignes_access on public.commande_lignes
  for all using (
    commande_id in (select id from public.commandes where mama_id = current_user_mama_id())
  ) with check (
    commande_id in (select id from public.commandes where mama_id = current_user_mama_id())
  );
grant select, insert, update, delete on public.commande_lignes to authenticated;

alter table public.templates_commandes enable row level security;
create policy templates_commandes_all on public.templates_commandes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on public.templates_commandes to authenticated;

alter table public.emails_envoyes enable row level security;
create policy emails_envoyes_all on public.emails_envoyes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
grant select, insert, update, delete on public.emails_envoyes to authenticated;
-- ✅ OK

-- ========================
-- 👁️ VUES
-- ========================
-- (aucune vue définie)
-- ✅ OK

-- ========================
-- ⚙️ FONCTIONS MÉTIER
-- ========================
create or replace function public.create_utilisateur(
  p_email text,
  p_nom text,
  p_role_id uuid,
  p_mama_id uuid
) returns json
language plpgsql
security definer as $$
declare
  v_auth_id uuid;
  v_password text;
begin
  if exists(select 1 from auth.users where lower(email) = lower(p_email)) then
    raise exception 'email exists';
  end if;
  v_password := encode(gen_random_bytes(9), 'base64');
  insert into auth.users(email, encrypted_password)
  values (p_email, crypt(v_password, gen_salt('bf'))) returning id into v_auth_id;
  insert into public.utilisateurs(nom, email, auth_id, role_id, mama_id, actif)
  values(p_nom, p_email, v_auth_id, p_role_id, p_mama_id, true);
  perform net.http_post(
    url => 'https://example.com/send',
    body => jsonb_build_object('email', p_email, 'password', v_password)
  );
  return json_build_object('success', true);
exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;$$;

grant execute on function public.create_utilisateur(text, text, uuid, uuid) to authenticated;
-- ✅ OK
