-- EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
-- TABLES

-- Table mamas
create table if not exists public.mamas (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete set null,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_mamas_mama_id on public.mamas(mama_id);

-- Table roles
create table if not exists public.roles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_roles_mama_id on public.roles(mama_id);

-- Table permissions
create table if not exists public.permissions (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    code text not null unique,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_permissions_mama_id on public.permissions(mama_id);

-- Table role_permissions (liaison)
create table if not exists public.role_permissions (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    role_id uuid references public.roles(id) on delete cascade,
    permission_id uuid references public.permissions(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create unique index if not exists ux_role_permissions on public.role_permissions(role_id, permission_id);
create index if not exists idx_role_permissions_mama_id on public.role_permissions(mama_id);

-- Table utilisateurs
create table if not exists public.utilisateurs (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    auth_id uuid unique,
    nom text,
    email text,
    role_id uuid references public.roles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_utilisateurs_mama_id on public.utilisateurs(mama_id);

-- Table familles
create table if not exists public.familles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_familles_mama_id on public.familles(mama_id);

-- Table sous_familles
create table if not exists public.sous_familles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    famille_id uuid references public.familles(id) on delete cascade,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_sous_familles_mama_id on public.sous_familles(mama_id);
create index if not exists idx_sous_familles_famille_id on public.sous_familles(famille_id);

-- Table unites
create table if not exists public.unites (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_unites_mama_id on public.unites(mama_id);

-- Table zones_stock
create table if not exists public.zones_stock (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_zones_stock_mama_id on public.zones_stock(mama_id);

-- Table fournisseurs
create table if not exists public.fournisseurs (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    contact text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_fournisseurs_mama_id on public.fournisseurs(mama_id);

-- Table produits
create table if not exists public.produits (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text not null,
    famille_id uuid references public.familles(id),
    sous_famille_id uuid references public.sous_familles(id),
    unite_id uuid references public.unites(id),
    zone_stock_id uuid references public.zones_stock(id),
    fournisseur_id uuid references public.fournisseurs(id),
    dernier_prix numeric(12,2),
    pmp numeric(12,2),
    tva numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_produits_mama_id on public.produits(mama_id);
create index if not exists idx_produits_famille_id on public.produits(famille_id);
create index if not exists idx_produits_zone_stock_id on public.produits(zone_stock_id);

-- Table commandes
create table if not exists public.commandes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    fournisseur_id uuid references public.fournisseurs(id),
    date_commande date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_commandes_mama_id on public.commandes(mama_id);

-- Table bons_livraison
create table if not exists public.bons_livraison (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    commande_id uuid references public.commandes(id) on delete cascade,
    numero text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_bons_livraison_mama_id on public.bons_livraison(mama_id);

-- Table lignes_bl
create table if not exists public.lignes_bl (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    bl_id uuid references public.bons_livraison(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric(12,2) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_lignes_bl_mama_id on public.lignes_bl(mama_id);
create index if not exists idx_lignes_bl_bl_id on public.lignes_bl(bl_id);

-- Table factures
create table if not exists public.factures (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    fournisseur_id uuid references public.fournisseurs(id),
    bl_id uuid references public.bons_livraison(id),
    lignes_produits jsonb,
    etat text,
    total_ht numeric(12,2),
    tva numeric(12,2),
    zone_id uuid references public.zones_stock(id),
    justificatif text,
    commentaire text,
    bon_livraison text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_factures_mama_id on public.factures(mama_id);

-- Table facture_lignes
create table if not exists public.facture_lignes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    facture_id uuid references public.factures(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric(12,2) not null,
    prix numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_facture_lignes_mama_id on public.facture_lignes(mama_id);
create index if not exists idx_facture_lignes_facture_id on public.facture_lignes(facture_id);

-- Table fiches_techniques
create table if not exists public.fiches_techniques (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    contenu jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_fiches_techniques_mama_id on public.fiches_techniques(mama_id);

-- Table stock_mouvements
create table if not exists public.stock_mouvements (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    type text not null,
    quantite numeric(12,2) not null,
    reference_id uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_stock_mouvements_mama_id on public.stock_mouvements(mama_id);
create index if not exists idx_stock_mouvements_produit_id on public.stock_mouvements(produit_id);

-- Table inventaires
create table if not exists public.inventaires (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    date_inventaire date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_inventaires_mama_id on public.inventaires(mama_id);

-- Table inventaire_lignes
create table if not exists public.inventaire_lignes (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    inventaire_id uuid references public.inventaires(id) on delete cascade,
    produit_id uuid references public.produits(id),
    stock_theorique numeric(12,2) default 0,
    stock_reel numeric(12,2) default 0,
    ecart numeric(12,2) default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_inventaire_lignes_mama_id on public.inventaire_lignes(mama_id);
create index if not exists idx_inventaire_lignes_inventaire_id on public.inventaire_lignes(inventaire_id);

-- Table documents
create table if not exists public.documents (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    titre text,
    url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_documents_mama_id on public.documents(mama_id);

-- Table notifications
create table if not exists public.notifications (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    utilisateur_id uuid references public.utilisateurs(id) on delete cascade,
    titre text,
    message text,
    lu boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_notifications_mama_id on public.notifications(mama_id);
create index if not exists idx_notifications_utilisateur_id on public.notifications(utilisateur_id);

-- Table gadgets
create table if not exists public.gadgets (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    nom text,
    configuration jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_gadgets_mama_id on public.gadgets(mama_id);

-- Table ventes_fiches_carte
create table if not exists public.ventes_fiches_carte (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    produit_id uuid references public.produits(id),
    quantite numeric(12,2),
    montant numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_ventes_fiches_carte_mama_id on public.ventes_fiches_carte(mama_id);

-- Table ventes_familles
create table if not exists public.ventes_familles (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    famille_id uuid references public.familles(id),
    quantite numeric(12,2),
    montant numeric(12,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_ventes_familles_mama_id on public.ventes_familles(mama_id);

-- Table feedback
create table if not exists public.feedback (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    utilisateur_id uuid references public.utilisateurs(id) on delete cascade,
    message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_feedback_mama_id on public.feedback(mama_id);

-- Table consentements_utilisateur
create table if not exists public.consentements_utilisateur (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid references public.mamas(id) on delete cascade,
    utilisateur_id uuid references public.utilisateurs(id) on delete cascade,
    type text,
    donne boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    actif boolean not null default true
);
create index if not exists idx_consentements_utilisateur_mama_id on public.consentements_utilisateur(mama_id);

-- Table periodes_comptables
create table if not exists public.periodes_comptables (
    id uuid primary key default gen_random_uuid(),
    mama_id uuid references public.mamas(id) on delete cascade,
    date_debut date not null,
    date_fin date not null,
    cloturee boolean default false,
    actuelle boolean default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_periodes_comptables_mama_id on public.periodes_comptables(mama_id);
create unique index if not exists idx_periodes_comptables_actuelle on public.periodes_comptables(mama_id) where actuelle;

-- Table taches
create table if not exists public.taches (
    id uuid primary key default gen_random_uuid(),
    mama_id uuid references public.mamas(id) on delete cascade,
    titre text not null,
    description text,
    priorite text check (priorite in ('basse','moyenne','haute')) default 'moyenne',
    statut text check (statut in ('a_faire','en_cours','terminee')) default 'a_faire',
    date_echeance date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_taches_mama_id on public.taches(mama_id);
create index if not exists idx_taches_statut on public.taches(statut);
create index if not exists idx_taches_priorite on public.taches(priorite);

-- Table utilisateurs_taches
create table if not exists public.utilisateurs_taches (
    tache_id uuid references public.taches(id) on delete cascade,
    utilisateur_id uuid references public.utilisateurs(id) on delete cascade,
    primary key (tache_id, utilisateur_id)
);
create index if not exists idx_utilisateurs_taches_tache on public.utilisateurs_taches(tache_id);
create index if not exists idx_utilisateurs_taches_utilisateur on public.utilisateurs_taches(utilisateur_id);

alter table if exists public.produits
  add column if not exists zone_stock_id uuid references public.zones_stock(id) on delete set null,
  add column if not exists tva numeric(12,2);

alter table if exists public.factures
  add column if not exists justificatif text,
  add column if not exists commentaire text,
  add column if not exists bon_livraison text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'familles' and column_name = 'parent_id'
  ) then
    alter table public.familles rename column parent_id to famille_parent_id;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'familles' and column_name = 'famille_parent_id'
  ) then
    alter table public.familles add column famille_parent_id uuid references public.familles(id) on delete set null;
  end if;
end$$;

-- FOREIGN KEYS
-- (définies lors de la création des tables)

-- INDEXES
-- (créés lors de la création des tables)

-- VIEWS

create or replace view public.v_produits_dernier_prix as
select p.id as produit_id, p.mama_id,
       (select fl.prix from public.facture_lignes fl
         join public.factures f on fl.facture_id = f.id
         where fl.produit_id = p.id
         order by f.created_at desc
         limit 1) as dernier_prix
from public.produits p;

create or replace view public.v_evolution_achats as
select mama_id,
       date_trunc('month', created_at) as mois,
       sum(quantite) as quantite
from public.stock_mouvements
where type = 'entree_achat'
group by mama_id, date_trunc('month', created_at);

create or replace view public.v_ventes_par_famille as
select vf.mama_id, f.nom as famille,
       sum(vf.quantite) as quantite,
       sum(vf.montant) as montant
from public.ventes_familles vf
join public.familles f on vf.famille_id = f.id
group by vf.mama_id, f.nom;

create or replace view public.v_ecarts_inventaire as
select il.mama_id, i.id as inventaire_id, p.nom as produit,
       il.stock_theorique, il.stock_reel, il.ecart
from public.inventaire_lignes il
join public.inventaires i on il.inventaire_id = i.id
join public.produits p on il.produit_id = p.id;

create or replace view public.v_notifications_non_lues as
select * from public.notifications where lu = false;

create or replace view public.v_stock_disponible as
select p.mama_id, p.id as produit_id,
       coalesce(sum(case
         when sm.type in ('entree_achat','entree_transfert','entree') then sm.quantite
         when sm.type in ('ajustement_inventaire','ajustement') then sm.quantite
         else -sm.quantite end),0) as stock
from public.produits p
left join public.stock_mouvements sm on sm.produit_id = p.id and sm.mama_id = p.mama_id
group by p.mama_id, p.id;

create or replace view public.v_stocks as
select * from public.v_stock_disponible;

create or replace view public.v_consommation_cumulee as
select p.mama_id, p.id as produit_id,
       coalesce(sum(case
         when sm.type in ('sortie_fiche','ajustement_inventaire','perte','don','sortie_transfert') then sm.quantite
         else 0 end),0) as consommation
from public.produits p
left join public.stock_mouvements sm on sm.produit_id = p.id and sm.mama_id = p.mama_id
group by p.mama_id, p.id;

create or replace view public.v_requisitions as
select * from public.v_stock_disponible;

create or replace view public.v_taches_assignees as
select
  t.id,
  t.mama_id,
  t.titre,
  t.description,
  t.priorite,
  t.statut,
  t.date_echeance,
  t.created_at,
  t.updated_at,
  ut.utilisateur_id,
  u.nom as utilisateur_nom,
  r.nom as utilisateur_role
from public.taches t
left join public.utilisateurs_taches ut on ut.tache_id = t.id
left join public.utilisateurs u on u.id = ut.utilisateur_id
left join public.roles r on r.id = u.role_id;

-- ========================
-- FUNCTIONS
-- ========================

create or replace function public.current_user_mama_id()
returns uuid
language sql stable as $$
  select u.mama_id from public.utilisateurs u where u.auth_id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text
language sql stable as $$
  select r.nom from public.roles r
  join public.utilisateurs u on u.role_id = r.id
  where u.auth_id = auth.uid();
$$;

create or replace function public.periode_actuelle(mid uuid)
returns table(
  id uuid,
  mama_id uuid,
  date_debut date,
  date_fin date,
  cloturee boolean,
  actuelle boolean
)
language sql stable as $$
  select * from public.periodes_comptables
  where mama_id = mid and actuelle = true
  limit 1;
$$;

create or replace function public.fn_sync_auth_user()
returns trigger
language plpgsql security definer as $$
begin
  insert into public.utilisateurs (auth_id, email)
    values (new.id, new.email)
    on conflict (auth_id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.apply_stock_from_achat(
  p_achat_id uuid,
  p_table text,
  p_mama_id uuid
)
returns void
language plpgsql as $$
declare
  r record;
  v_stock numeric;
  v_pmp numeric;
begin
  delete from public.stock_mouvements
    where type = 'entree_achat' and reference_id = p_achat_id;
  if p_table = 'factures' then
    for r in
      select fl.produit_id, fl.quantite, fl.prix
      from public.facture_lignes fl
      join public.factures f on f.id = fl.facture_id
      where f.id = p_achat_id and f.mama_id = p_mama_id and fl.actif is true
    loop
      insert into public.stock_mouvements(mama_id, date, type, quantite, produit_id, reference_id)
        values (p_mama_id, now(), 'entree_achat', r.quantite, r.produit_id, p_achat_id);
      select coalesce(stock_reel,0), coalesce(pmp,0) into v_stock, v_pmp
        from public.produits where id = r.produit_id and mama_id = p_mama_id;
      update public.produits
         set dernier_prix = r.prix,
             pmp = case when v_stock + r.quantite = 0 then r.prix
                        else ((v_stock * v_pmp) + (r.quantite * r.prix)) / (v_stock + r.quantite) end
       where id = r.produit_id and mama_id = p_mama_id;
    end loop;
  elsif p_table = 'bons_livraison' then
    for r in
      select l.produit_id, l.quantite_recue as quantite, l.prix_achat as prix
      from public.lignes_bl l
      join public.bons_livraison b on b.id = l.bl_id
      where b.id = p_achat_id and b.mama_id = p_mama_id
    loop
      insert into public.stock_mouvements(mama_id, date, type, quantite, produit_id, reference_id)
        values (p_mama_id, now(), 'entree_achat', r.quantite, r.produit_id, p_achat_id);
      select coalesce(stock_reel,0), coalesce(pmp,0) into v_stock, v_pmp
        from public.produits where id = r.produit_id and mama_id = p_mama_id;
      update public.produits
         set dernier_prix = r.prix,
             pmp = case when v_stock + r.quantite = 0 then r.prix
                        else ((v_stock * v_pmp) + (r.quantite * r.prix)) / (v_stock + r.quantite) end
       where id = r.produit_id and mama_id = p_mama_id;
    end loop;
  end if;
end;
$$;

create or replace function public.insert_stock_from_transfert_ligne(p_ligne_id uuid)
returns void
language plpgsql as $$
declare
  l record;
begin
  select tl.*, t.mama_id, t.zone_source_id, t.zone_dest_id, t.utilisateur_id, t.date_transfert, coalesce(t.commentaire, tl.commentaire) as commentaire
    into l
    from public.transfert_lignes tl
    join public.transferts t on t.id = tl.transfert_id
    where tl.id = p_ligne_id;
  if l.id is null then return; end if;
  insert into public.stock_mouvements(mama_id, produit_id, type, quantite, date, zone_id, zone_source_id, zone_destination_id, auteur_id, commentaire)
    values (l.mama_id, l.produit_id, 'sortie_transfert', l.quantite, l.date_transfert, l.zone_source_id, l.zone_source_id, l.zone_dest_id, l.utilisateur_id, l.commentaire);
  insert into public.stock_mouvements(mama_id, produit_id, type, quantite, date, zone_id, zone_source_id, zone_destination_id, auteur_id, commentaire)
    values (l.mama_id, l.produit_id, 'entree_transfert', l.quantite, l.date_transfert, l.zone_dest_id, l.zone_source_id, l.zone_dest_id, l.utilisateur_id, l.commentaire);
end;
$$;

create or replace function public.set_requisition_stock_theorique(p_inventaire_id uuid)
returns void
language plpgsql as $$
begin
  update public.inventaire_lignes il
     set stock_theorique = coalesce((
       select sum(case
         when type in ('entree_achat','entree','entree_transfert') then quantite
         when type in ('ajustement_inventaire','ajustement') then quantite
         else -quantite end)
       from public.stock_mouvements sm
       where sm.produit_id = il.produit_id and sm.mama_id = il.mama_id
     ),0)
  where il.inventaire_id = p_inventaire_id;
end;
$$;

create or replace function public.apply_stock_from_fiche(p_vente_id uuid)
returns void
language plpgsql as $$
declare
  v record;
  l record;
begin
  select * into v from public.ventes_fiches_carte where id = p_vente_id;
  if v.id is null then return; end if;
  delete from public.stock_mouvements where type = 'sortie_fiche' and reference_id = p_vente_id;
  for l in select produit_id, quantite from public.fiche_lignes where fiche_id = v.fiche_id loop
    insert into public.stock_mouvements(mama_id, produit_id, type, quantite, reference_id)
    values (v.mama_id, l.produit_id, 'sortie_fiche', l.quantite * v.ventes, p_vente_id);
  end loop;
end;
$$;

create or replace function public.apply_inventaire_line(p_ligne_id uuid)
returns void
language plpgsql as $$
declare
  l record;
  v_ecart numeric;
begin
  select * into l from public.inventaire_lignes where id = p_ligne_id;
  if l.id is null then return; end if;
  v_ecart := coalesce(l.stock_reel,0) - coalesce(l.stock_theorique,0);
  update public.inventaire_lignes set ecart = v_ecart where id = p_ligne_id;
  delete from public.stock_mouvements where type = 'ajustement_inventaire' and reference_id = p_ligne_id;
  if v_ecart <> 0 then
    insert into public.stock_mouvements(mama_id, produit_id, type, quantite, reference_id)
    values (l.mama_id, l.produit_id, 'ajustement_inventaire', v_ecart, p_ligne_id);
  end if;
end;
$$;

-- ========================
-- Additional trigger functions
-- ========================

create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_delete_if_linked()
returns trigger
language plpgsql as $$
begin
  raise exception 'Suppression interdite : enregistrement lié';
end;
$$;

create or replace function public.trg_apply_stock_from_achat()
returns trigger
language plpgsql as $$
begin
  perform public.apply_stock_from_achat(
    coalesce(new.facture_id, old.facture_id),
    'factures',
    coalesce(new.mama_id, old.mama_id)
  );
  return new;
end;
$$;

create or replace function public.trg_insert_stock_from_transfert_ligne()
returns trigger
language plpgsql as $$
begin
  perform public.insert_stock_from_transfert_ligne(new.id);
  return new;
end;
$$;

create or replace function public.trg_set_requisition_stock_theorique()
returns trigger
language plpgsql as $$
begin
  perform public.set_requisition_stock_theorique(new.inventaire_id);
  return new;
end;
$$;

create or replace function public.trg_apply_stock_facture()
returns trigger
language plpgsql as $$
begin
  perform public.apply_stock_from_achat(new.id, 'factures', new.mama_id);
  return new;
end;
$$;

create or replace function public.trg_apply_stock_bl()
returns trigger
language plpgsql as $$
begin
  perform public.apply_stock_from_achat(new.id, 'bons_livraison', new.mama_id);
  return new;
end;
$$;

create or replace function public.trg_apply_stock_from_fiche()
returns trigger
language plpgsql as $$
begin
  perform public.apply_stock_from_fiche(coalesce(new.id, old.id));
  return new;
end;
$$;

create or replace function public.trg_apply_inventaire_line()
returns trigger
language plpgsql as $$
begin
  perform public.apply_inventaire_line(coalesce(new.id, old.id));
  return new;
end;
$$;

-- ========================
-- 5. TRIGGERS
-- ========================

-- Synchronisation avec auth.users
drop trigger if exists trg_sync_auth_user on auth.users;
create trigger trg_sync_auth_user
  after insert or update on auth.users
  for each row execute function public.fn_sync_auth_user();

-- updated_at triggers
do $$
declare t text;
begin
    foreach t in array array[
      'mamas','roles','permissions','role_permissions','utilisateurs','familles','sous_familles','unites','zones_stock','fournisseurs','produits','commandes','bons_livraison','lignes_bl','factures','facture_lignes','fiches_techniques','stock_mouvements','inventaires','inventaire_lignes','documents','notifications','gadgets','ventes_fiches_carte','ventes_familles','feedback','consentements_utilisateur','periodes_comptables','taches'
    ]
  loop
    execute format('drop trigger if exists set_timestamp on public.%I;', t);
    execute format('create trigger set_timestamp before update on public.%I for each row execute function public.trigger_set_timestamp();', t);
  end loop;
end$$;

-- TRIGGERS
drop trigger if exists trg_apply_stock_from_achat on public.facture_lignes;
create trigger trg_apply_stock_from_achat
  after insert or update or delete on public.facture_lignes
  for each row execute function public.trg_apply_stock_from_achat();

drop trigger if exists trg_apply_stock_facture on public.factures;
create trigger trg_apply_stock_facture
  after insert on public.factures
  for each row execute function public.trg_apply_stock_facture();

drop trigger if exists trg_apply_stock_bl on public.bons_livraison;
create trigger trg_apply_stock_bl
  after insert on public.bons_livraison
  for each row execute function public.trg_apply_stock_bl();

drop trigger if exists trg_insert_stock_from_transfert_ligne on public.lignes_bl;
create trigger trg_insert_stock_from_transfert_ligne
  after insert on public.lignes_bl
  for each row execute function public.trg_insert_stock_from_transfert_ligne();

drop trigger if exists trg_apply_stock_from_fiche on public.ventes_fiches_carte;
create trigger trg_apply_stock_from_fiche
  after insert or update or delete on public.ventes_fiches_carte
  for each row execute function public.trg_apply_stock_from_fiche();

drop trigger if exists trg_apply_inventaire_line on public.inventaire_lignes;
create trigger trg_apply_inventaire_line
  after insert or update or delete on public.inventaire_lignes
  for each row execute function public.trg_apply_inventaire_line();

drop trigger if exists trg_set_requisition_stock_theorique on public.inventaire_lignes;
create trigger trg_set_requisition_stock_theorique
  after insert or update on public.inventaire_lignes
  for each row execute function public.trg_set_requisition_stock_theorique();

-- Exemple de protection sur produits
drop trigger if exists trg_prevent_delete_produits on public.produits;
create trigger trg_prevent_delete_produits
  before delete on public.produits
  for each row execute function public.prevent_delete_if_linked();

-- RLS
do $$
declare t text;
begin
  foreach t in array array[
    'mamas','roles','permissions','role_permissions','utilisateurs','familles','sous_familles','unites','zones_stock','fournisseurs','produits','commandes','bons_livraison','lignes_bl','factures','facture_lignes','fiches_techniques','stock_mouvements','inventaires','inventaire_lignes','documents','notifications','gadgets','ventes_fiches_carte','ventes_familles','feedback','consentements_utilisateur','periodes_comptables','taches'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists mama_policy on public.%I;', t);
    execute format('create policy mama_policy on public.%I using (mama_id = public.current_user_mama_id()) with check (mama_id = public.current_user_mama_id());', t);
  end loop;
end$$;

alter table public.utilisateurs_taches enable row level security;
drop policy if exists utilisateurs_taches_policy on public.utilisateurs_taches;
create policy utilisateurs_taches_policy on public.utilisateurs_taches
  using (
    exists (
      select 1 from public.taches t
      where t.id = tache_id and t.mama_id = public.current_user_mama_id()
    )
  )
  with check (
    exists (
      select 1 from public.taches t
      where t.id = tache_id and t.mama_id = public.current_user_mama_id()
    )
  );

-- GRANTS
do $$
declare t text;
begin
  foreach t in array array[
    'mamas','roles','permissions','role_permissions','utilisateurs','familles','sous_familles','unites','zones_stock','fournisseurs','produits','commandes','bons_livraison','lignes_bl','factures','facture_lignes','fiches_techniques','stock_mouvements','inventaires','inventaire_lignes','documents','notifications','gadgets','ventes_fiches_carte','ventes_familles','feedback','consentements_utilisateur','periodes_comptables','taches'
  ]
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end$$;

grant select, insert, update, delete on public.utilisateurs_taches to authenticated;

-- ========================
-- FIN DU SCRIPT
-- ========================
