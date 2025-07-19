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
  add column if not exists email text,
  add column if not exists contact text;
alter table if exists fournisseurs enable row level security;
alter table if exists fournisseurs force row level security;
drop policy if exists fournisseurs_all on fournisseurs;
create policy fournisseurs_all on fournisseurs
  for all using (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  with check (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

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

-- Vue performance fiches : popularité, volume et coût
create or replace view v_performance_fiches as
with ventes as (
  select mama_id, fiche_id, sum(ventes) as volume
  from ventes_fiches_carte
  where actif = true
  group by mama_id, fiche_id
), totals as (
  select mama_id, sum(ventes) as total_volume
  from ventes_fiches_carte
  where actif = true
  group by mama_id
)
select
  f.mama_id,
  f.id as fiche_id,
  f.nom,
  coalesce(f.cout_portion, case when f.portions > 0 then f.cout_total / f.portions else null end) as cout,
  coalesce(v.volume, 0) as volume,
  case when t.total_volume > 0 then coalesce(v.volume,0)::numeric / t.total_volume else 0 end as popularite
from fiches_techniques f
left join ventes v on v.fiche_id = f.id and v.mama_id = f.mama_id
left join totals t on t.mama_id = f.mama_id
where f.actif = true;

-- Tables promotions et promotion_produits pour le module Promotions
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references mamas(id),
  nom text,
  description text,
  date_debut date,
  date_fin date,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_promotions_mama_id on promotions(mama_id);
create index if not exists idx_promotions_created_at on promotions(created_at);
create trigger if not exists trg_set_updated_at_promotions
  before update on promotions
  for each row execute procedure set_updated_at();
alter table if exists promotions enable row level security;
alter table if exists promotions force row level security;
drop policy if exists promotions_all on promotions;
create policy promotions_all on promotions
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create table if not exists promotion_produits (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references mamas(id),
  promotion_id uuid references promotions(id),
  produit_id uuid references produits(id),
  discount numeric,
  prix_promo numeric,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_promotion_produits_mama_id on promotion_produits(mama_id);
create trigger if not exists trg_set_updated_at_promotion_produits
  before update on promotion_produits
  for each row execute procedure set_updated_at();
alter table if exists promotion_produits enable row level security;
alter table if exists promotion_produits force row level security;
drop policy if exists promotion_produits_all on promotion_produits;
create policy promotion_produits_all on promotion_produits
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Alignement module Produits
alter table if exists produits
  add column if not exists dernier_prix numeric;
alter table if exists produits enable row level security;
alter table if exists produits force row level security;
drop policy if exists produits_all on produits;
create policy produits_all on produits
  for all using (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  with check (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

alter table if exists fournisseur_produits enable row level security;
alter table if exists fournisseur_produits force row level security;
drop policy if exists fournisseur_produits_all on fournisseur_produits;
create policy fournisseur_produits_all on fournisseur_produits
  for all using (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  with check (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

-- Alignement tables Factures et lignes
alter table if exists factures
  add column if not exists montant_total numeric;
update factures set montant_total = coalesce(total_ttc, 0)
  where montant_total is null;

alter table if exists facture_lignes
  add column if not exists prix_unitaire numeric,
  add column if not exists tva numeric,
  add column if not exists total numeric;
update facture_lignes
  set prix_unitaire = coalesce(prix, 0),
      total = coalesce(quantite * coalesce(prix,0), 0)
  where prix_unitaire is null;
create trigger if not exists trg_set_updated_at_facture_lignes
  before update on facture_lignes
  for each row execute procedure set_updated_at();

alter table if exists factures enable row level security;
alter table if exists factures force row level security;
drop policy if exists factures_all on factures;
create policy factures_all on factures
  for all using (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  with check (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

alter table if exists facture_lignes enable row level security;
alter table if exists facture_lignes force row level security;
drop policy if exists facture_lignes_all on facture_lignes;
create policy facture_lignes_all on facture_lignes
  for all using (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  with check (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

-- Table achats pour historique des prix
create table if not exists achats (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references mamas(id),
  produit_id uuid references produits(id),
  supplier_id uuid references fournisseurs(id),
  prix numeric,
  quantite numeric,
  date_achat date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_achats_mama_id on achats(mama_id);
create index if not exists idx_achats_date on achats(date_achat);
create trigger if not exists trg_set_updated_at_achats
  before update on achats
  for each row execute procedure set_updated_at();
alter table if exists achats enable row level security;
alter table if exists achats force row level security;
drop policy if exists achats_all on achats;
create policy achats_all on achats
  for all using (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  with check (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

-- Module Bons de Livraison
alter table if exists bons_livraison
  add column if not exists date_reception date,
  add column if not exists commentaire text,
  add column if not exists actif boolean default true,
  add column if not exists updated_at timestamptz default now();

update bons_livraison set date_reception = coalesce(date_reception, date_livraison);

create index if not exists idx_bons_livraison_actif on bons_livraison(actif);
create trigger if not exists trg_set_updated_at_bons_livraison
  before update on bons_livraison
  for each row execute procedure set_updated_at();
alter table if exists bons_livraison enable row level security;
alter table if exists bons_livraison force row level security;
drop policy if exists bons_livraison_all on bons_livraison;
create policy bons_livraison_all on bons_livraison
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create table if not exists bons_livraison_lignes (
  id uuid primary key default gen_random_uuid(),
  bon_livraison_id uuid references bons_livraison(id) on delete cascade,
  produit_id uuid references produits(id),
  quantite_recue numeric,
  prix_unitaire numeric,
  tva numeric,
  mama_id uuid references mamas(id),
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_bons_livraison_lignes_bl on bons_livraison_lignes(bon_livraison_id);
create index if not exists idx_bons_livraison_lignes_mama on bons_livraison_lignes(mama_id);
create trigger if not exists trg_set_updated_at_bl_lignes
  before update on bons_livraison_lignes
  for each row execute procedure set_updated_at();
alter table if exists bons_livraison_lignes enable row level security;
alter table if exists bons_livraison_lignes force row level security;
drop policy if exists bons_livraison_lignes_all on bons_livraison_lignes;
create policy bons_livraison_lignes_all on bons_livraison_lignes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Module Réquisitions
alter table if exists requisitions
  add column if not exists numero text,
  add column if not exists date date,
  add column if not exists zone_source_id uuid references zones_stock(id),
  add column if not exists zone_destination_id uuid references zones_stock(id),
  add column if not exists statut text,
  add column if not exists actif boolean default true;

create table if not exists requisition_lignes (
  id uuid primary key default gen_random_uuid(),
  requisition_id uuid references requisitions(id) on delete cascade,
  produit_id uuid references produits(id),
  quantite numeric,
  commentaire text,
  mama_id uuid references mamas(id),
  actif boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_requisition_lignes_requisition on requisition_lignes(requisition_id);
create index if not exists idx_requisition_lignes_mama on requisition_lignes(mama_id);
alter table if exists requisition_lignes enable row level security;
alter table if exists requisition_lignes force row level security;
drop policy if exists requisition_lignes_all on requisition_lignes;
create policy requisition_lignes_all on requisition_lignes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create or replace view v_stock_requisitionne as
select produit_id, sum(quantite) as total_requisitionne, mama_id
from requisition_lignes
join requisitions on requisitions.id = requisition_lignes.requisition_id
where requisitions.actif is true
group by produit_id, mama_id;

-- Module Planning prévisionnel
create table if not exists planning_previsionnel (
  id uuid primary key default gen_random_uuid(),
  nom text,
  date_prevue date,
  commentaire text,
  statut text default 'prévu',
  mama_id uuid references mamas(id),
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_planning_prev_mama on planning_previsionnel(mama_id);
create index if not exists idx_planning_prev_date on planning_previsionnel(date_prevue);
create index if not exists idx_planning_prev_statut on planning_previsionnel(statut);
create index if not exists idx_planning_prev_actif on planning_previsionnel(actif);
create index if not exists idx_planning_prev_updated on planning_previsionnel(updated_at);
alter table if exists planning_previsionnel enable row level security;
alter table if exists planning_previsionnel force row level security;
drop policy if exists planning_previsionnel_all on planning_previsionnel;
create policy planning_previsionnel_all on planning_previsionnel
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
create trigger if not exists trg_set_updated_at_planning_prev
  before update on planning_previsionnel
  for each row execute procedure set_updated_at();

create table if not exists planning_lignes (
  id uuid primary key default gen_random_uuid(),
  planning_id uuid references planning_previsionnel(id) on delete cascade,
  produit_id uuid references produits(id),
  quantite numeric,
  observation text,
  mama_id uuid references mamas(id),
  actif boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_planning_lignes_planning on planning_lignes(planning_id);
create index if not exists idx_planning_lignes_mama on planning_lignes(mama_id);
alter table if exists planning_lignes enable row level security;
alter table if exists planning_lignes force row level security;
drop policy if exists planning_lignes_all on planning_lignes;
create policy planning_lignes_all on planning_lignes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());


-- Consolidation multi-sites
create or replace view v_consolidated_stats as
select mama_id, count(*) as total_produits, sum(stock) as stock_total
from produits
where actif is true
group by mama_id;
-- Table journal_audit pour audit avancé
create table if not exists journal_audit (
  id uuid primary key default gen_random_uuid(),
  table_modifiee text,
  operation text,
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id),
  date_action timestamptz default now(),
  donnees_avant jsonb,
  donnees_apres jsonb
);
create index if not exists idx_journal_audit_mama on journal_audit(mama_id);

create or replace function insert_journal_audit() returns trigger as $$
begin
  insert into journal_audit(
    table_modifiee,
    operation,
    utilisateur_id,
    mama_id,
    date_action,
    donnees_avant,
    donnees_apres
  ) values (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    coalesce(new.mama_id, old.mama_id),
    now(),
    row_to_json(old),
    row_to_json(new)
  );
  if TG_OP = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql;

create trigger trg_audit_produits
  after insert or update or delete on produits
  for each row execute procedure insert_journal_audit();

create trigger trg_audit_factures
  after insert or update or delete on factures
  for each row execute procedure insert_journal_audit();


-- Vues pour le module d'analyse avancée
create or replace view v_monthly_purchases as
select f.mama_id,
       to_char(date_trunc('month', f.date_facture), 'YYYY-MM') as mois,
       sum(fl.prix_unitaire * fl.quantite) as total
from factures f
join facture_lignes fl on fl.facture_id = f.id
where f.actif = true
  and fl.actif = true
group by f.mama_id, to_char(date_trunc('month', f.date_facture), 'YYYY-MM');

create or replace view v_pmp as
select p.mama_id,
       p.id as produit_id,
       p.actif as produit_actif,
       bool_or(fp.actif) as fournisseur_produit_actif,
       coalesce(avg(fp.prix_achat), 0) as pmp
from produits p
left join fournisseur_produits fp on fp.produit_id = p.id and fp.mama_id = p.mama_id
group by p.mama_id, p.id, p.actif;

create or replace view v_ecarts_inventaire as
select i.mama_id,
       l.produit_id,
       i.date as date,
       l.zone_id as zone,
       l.quantite_theorique as stock_theorique,
       l.quantite_reelle as stock_reel,
       l.quantite_reelle - l.quantite_theorique as ecart,
       l.motif
from inventaires i
join inventaire_lignes l on l.inventaire_id = i.id
where i.actif = true
  and l.actif = true;

create or replace view v_evolution_achats as
select f.mama_id,
       fl.produit_id,
       to_char(date_trunc('month', f.date_facture), 'YYYY-MM') as mois,
       sum(fl.prix_unitaire * fl.quantite) as montant
from facture_lignes fl
join factures f on f.id = fl.facture_id
where f.actif = true
  and fl.actif = true
group by f.mama_id, fl.produit_id, to_char(date_trunc('month', f.date_facture), 'YYYY-MM');

-- Table consentements_utilisateur pour RGPD
create table if not exists consentements_utilisateur (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id),
  type_consentement text,
  donne boolean,
  date_consentement timestamptz default now()
);

alter table if exists consentements_utilisateur
  rename column if exists user_id to utilisateur_id;
alter table if exists consentements_utilisateur
  rename column if exists consentement to donne;
alter table if exists consentements_utilisateur
  add column if not exists type_consentement text;

-- Table notifications pour le module Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id),
  titre text,
  message text,
  lu boolean default false,
  date_envoi timestamptz default now()
);
create index if not exists idx_notifications_mama_id on notifications(mama_id);
create index if not exists idx_notifications_user on notifications(utilisateur_id);

-- Préférences de notification par utilisateur
create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id),
  email_enabled boolean default true,
  webhook_enabled boolean default false,
  webhook_url text,
  webhook_token text,
  updated_at timestamptz default now()
);
create unique index if not exists uniq_notif_prefs_user on notification_preferences(utilisateur_id, mama_id);
