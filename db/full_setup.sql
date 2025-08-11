-- Schema initial de MamaStock

-- 1. Extensions
create extension if not exists "pgcrypto";

create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;

do $$ begin
  create role authenticated noinherit;
exception when duplicate_object then null; end $$;

-- 2. Tables

create table if not exists public.mamas (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  nom text not null,
  description text,
  access_rights jsonb not null default '{}'::jsonb,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.utilisateurs (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  role_id uuid references public.roles(id),
  nom text not null,
  email text not null,
  auth_id uuid unique,
  access_rights jsonb not null default '{}'::jsonb,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fournisseurs (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  nom text not null,
  contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.unites (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  nom text not null,
  abreviation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.familles (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  nom text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sous_familles (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  famille_id uuid references public.familles(id) on delete cascade,
  nom text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.produits (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  nom text not null,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  unite_id uuid references public.unites(id),
  famille_id uuid references public.familles(id),
  sous_famille_id uuid references public.sous_familles(id),
  dernier_prix numeric(12,2),
  stock_reel numeric default 0,
  stock_min numeric default 0,
  pmp numeric default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fiches_techniques (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  nom text not null,
  type text not null,
  famille_id uuid references public.familles(id),
  sous_famille_id uuid references public.sous_familles(id),
  prix_vente numeric(12,2),
  cout_par_portion numeric(12,2),
  portions numeric default 1,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commandes (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  reference text,
  date_commande date default current_date,
  statut text not null default 'brouillon' check (statut in ('brouillon','validée','envoyée')),
  commentaire text,
  envoyee_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commande_lignes (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  commande_id uuid not null references public.commandes(id) on delete cascade,
  produit_id uuid not null references public.produits(id),
  quantite numeric,
  unite_id uuid references public.unites(id),
  prix_achat numeric,
  total_ligne numeric generated always as (coalesce(quantite,0) * coalesce(prix_achat,0)) stored,
  commentaire text
);

create table if not exists public.templates_commandes (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  nom text not null,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mama_id, nom, fournisseur_id)
);

create table if not exists public.emails_envoyes (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  commande_id uuid not null references public.commandes(id) on delete cascade,
  email text not null,
  statut text not null default 'en_attente' check (statut in ('en_attente','succès','erreur')),
  envoye_le timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  module text not null,
  droit text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.consentements_utilisateur (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  utilisateur_id uuid not null references public.utilisateurs(id) on delete cascade,
  type_consentement text not null,
  consentement boolean not null,
  date_consentement timestamptz not null default now()
);

create table if not exists public.zones_stock (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  nom text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transferts (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  zone_source_id uuid references public.zones_stock(id),
  zone_cible_id uuid references public.zones_stock(id),
  date_transfert date not null default current_date,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lignes_transfert (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  transfert_id uuid not null references public.transferts(id) on delete cascade,
  produit_id uuid not null references public.produits(id),
  quantite numeric not null,
  unite_id uuid references public.unites(id),
  observations text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menus_jour (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  date_menu date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menus_jour_fiches (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  menu_jour_id uuid not null references public.menus_jour(id) on delete cascade,
  fiche_id uuid not null references public.fiches_techniques(id) on delete restrict,
  portions numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ventes_fiches_carte (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references public.mamas(id) on delete cascade,
  fiche_id uuid not null references public.fiches_techniques(id) on delete cascade,
  periode date not null,
  ventes numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists idx_roles_mama on public.roles(mama_id);
create index if not exists idx_utilisateurs_mama on public.utilisateurs(mama_id);
create index if not exists idx_fournisseurs_mama on public.fournisseurs(mama_id);
create index if not exists idx_unites_mama on public.unites(mama_id);
create index if not exists idx_familles_mama on public.familles(mama_id);
create index if not exists idx_sous_familles_famille on public.sous_familles(famille_id);
create index if not exists idx_produits_mama on public.produits(mama_id);
create index if not exists idx_produits_famille on public.produits(famille_id);
create index if not exists idx_produits_sous_famille on public.produits(sous_famille_id);
create index if not exists idx_produits_fournisseur on public.produits(fournisseur_id);
create index if not exists idx_fiches_techniques_mama on public.fiches_techniques(mama_id);
create index if not exists idx_commandes_mama on public.commandes(mama_id);
create index if not exists idx_commande_lignes_commande on public.commande_lignes(commande_id);
create index if not exists idx_templates_commandes_mama on public.templates_commandes(mama_id);
create index if not exists idx_emails_envoyes_mama on public.emails_envoyes(mama_id);
create index if not exists idx_permissions_mama on public.permissions(mama_id);
create index if not exists idx_consentements_mama on public.consentements_utilisateur(mama_id);
create index if not exists idx_zones_stock_mama on public.zones_stock(mama_id);
create index if not exists idx_transferts_mama on public.transferts(mama_id);
create index if not exists idx_transferts_date on public.transferts(mama_id, date_transfert);
create index if not exists idx_lignes_transfert_transfert on public.lignes_transfert(transfert_id);
create index if not exists idx_lignes_transfert_produit on public.lignes_transfert(produit_id);
create index if not exists idx_menus_jour_mama on public.menus_jour(mama_id, date_menu);
create index if not exists idx_menus_jour_fiches_menu on public.menus_jour_fiches(menu_jour_id);
create index if not exists idx_ventes_fiches_carte_periode on public.ventes_fiches_carte(mama_id, periode);

-- 4. Fonctions
drop function if exists public.trg_set_timestamp() cascade;
create or replace function public.trg_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;
grant execute on function public.trg_set_timestamp() to authenticated;

drop function if exists public.current_user_mama_id() cascade;
create or replace function public.current_user_mama_id()
returns uuid language sql stable as $$
  select u.mama_id
  from public.utilisateurs u
  where u.auth_id = auth.uid()
  limit 1
$$;
grant execute on function public.current_user_mama_id() to authenticated;

drop function if exists public.current_user_is_admin_or_manager() cascade;
create or replace function public.current_user_is_admin_or_manager()
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.utilisateurs u
    join public.roles r on r.id = u.role_id
    where u.auth_id = auth.uid()
      and r.nom in ('admin', 'manager')
  )
$$;
grant execute on function public.current_user_is_admin_or_manager() to authenticated;

-- 5. Triggers
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_roles_updated_at') then
    create trigger trg_roles_updated_at before update on public.roles
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_utilisateurs_updated_at') then
    create trigger trg_utilisateurs_updated_at before update on public.utilisateurs
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_fournisseurs_updated_at') then
    create trigger trg_fournisseurs_updated_at before update on public.fournisseurs
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_unites_updated_at') then
    create trigger trg_unites_updated_at before update on public.unites
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_familles_updated_at') then
    create trigger trg_familles_updated_at before update on public.familles
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_sous_familles_updated_at') then
    create trigger trg_sous_familles_updated_at before update on public.sous_familles
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_produits_updated_at') then
    create trigger trg_produits_updated_at before update on public.produits
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_fiches_techniques_updated_at') then
    create trigger trg_fiches_techniques_updated_at before update on public.fiches_techniques
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_commandes_updated_at') then
    create trigger trg_commandes_updated_at before update on public.commandes
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_templates_commandes_updated_at') then
    create trigger trg_templates_commandes_updated_at before update on public.templates_commandes
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_transferts_updated_at') then
    create trigger trg_transferts_updated_at before update on public.transferts
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_lignes_transfert_updated_at') then
    create trigger trg_lignes_transfert_updated_at before update on public.lignes_transfert
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_menus_jour_updated_at') then
    create trigger trg_menus_jour_updated_at before update on public.menus_jour
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_menus_jour_fiches_updated_at') then
    create trigger trg_menus_jour_fiches_updated_at before update on public.menus_jour_fiches
      for each row execute function public.trg_set_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ventes_fiches_carte_updated_at') then
    create trigger trg_ventes_fiches_carte_updated_at before update on public.ventes_fiches_carte
      for each row execute function public.trg_set_timestamp();
  end if;
end$$;

-- 6. RLS et GRANTs
do $rls$
declare
  r record;
begin
  for r in select tablename
           from pg_tables
          where schemaname = 'public'
            and tablename in (
              'roles','utilisateurs','fournisseurs','unites','familles','sous_familles',
              'produits','fiches_techniques','commandes','commande_lignes','templates_commandes',
              'emails_envoyes','permissions','consentements_utilisateur','zones_stock','transferts',
              'lignes_transfert','menus_jour','menus_jour_fiches','ventes_fiches_carte'
            )
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format('alter table public.%I force row level security', r.tablename);
    -- SELECT
    execute format($$
      do $policy$
      begin
        if not exists (
          select 1 from pg_policies
          where schemaname = 'public' and tablename = %L and policyname = %L
        ) then
          create policy %I_select on public.%I
            for select using (mama_id = current_user_mama_id());
        end if;
      end
      $policy$;$$, r.tablename, r.tablename||'_select', r.tablename||'_select', r.tablename);
    -- WCU
    execute format($$
      do $policy$
      begin
        if not exists (
          select 1 from pg_policies
          where schemaname = 'public' and tablename = %L and policyname = %L
        ) then
          create policy %I_wcu on public.%I
            for all using (mama_id = current_user_mama_id())
            with check (mama_id = current_user_mama_id());
        end if;
      end
      $policy$;$$, r.tablename, r.tablename||'_wcu', r.tablename||'_wcu', r.tablename);
    execute format('grant select, insert, update, delete on public.%I to authenticated', r.tablename);
  end loop;
end
$rls$;

alter table public.mamas enable row level security;
alter table public.mamas force row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mamas' and policyname='mamas_select') then
    create policy mamas_select on public.mamas
      for select using (id = current_user_mama_id());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mamas' and policyname='mamas_wcu') then
    create policy mamas_wcu on public.mamas
      for all using (id = current_user_mama_id())
      with check (id = current_user_mama_id());
  end if;
end $$;
grant select, insert, update, delete on public.mamas to authenticated;

-- 7. Vues
create or replace view public.v_menu_engineering as
select
  mj.mama_id,
  mj.date_menu,
  f.id as fiche_id,
  f.nom,
  f.prix_vente,
  f.cout_par_portion,
  mlf.portions,
  (f.prix_vente - f.cout_par_portion) as marge_unitaire,
  (f.prix_vente - f.cout_par_portion) * mlf.portions as marge_totale
from public.menus_jour mj
join public.menus_jour_fiches mlf on mlf.menu_jour_id = mj.id and mlf.mama_id = mj.mama_id
join public.fiches_techniques f on f.id = mlf.fiche_id and f.mama_id = mj.mama_id;
grant select on public.v_menu_engineering to authenticated;

-- 8. Données initiales (optionnel)
