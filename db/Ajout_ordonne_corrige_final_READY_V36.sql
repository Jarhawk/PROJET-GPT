-- Ajout des colonnes mama_id aux tables utilisées
ALTER TABLE IF EXISTS centres_de_cout ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS facture_lignes ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS factures ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS fiches_techniques ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS fournisseur_produits ADD COLUMN IF NOT EXISTS mama_id uuid;


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



-- Fonction import_invoice correctement définie
create or replace function import_invoice(payload jsonb) returns uuid as $$
declare
  f_id uuid;
  ligne jsonb;
begin
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

  return f_id;
end;
$$ language plpgsql;

grant execute on function import_invoice(jsonb) to authenticated;


-- Sécurité pour les modules utilisateurs et rôles
alter table if exists utilisateurs enable row level security;
alter table if exists utilisateurs force row level security;

alter table if exists roles enable row level security;
alter table if exists roles force row level security;

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

-- Ajout colonne 'nom' manquante pour la vue v_performance_fiches
-- Ajout colonne 'nom' manquante pour la vue v_performance_fiches
ALTER TABLE IF EXISTS fiches_techniques ADD COLUMN IF NOT EXISTS nom text;

-- Ajout colonne 'cout_par_portion' manquante pour la vue v_performance_fiches
ALTER TABLE IF EXISTS fiches_techniques ADD COLUMN IF NOT EXISTS cout_par_portion numeric;

create or replace view v_performance_fiches as
-- Ajout manquant pour compatibilité avec v_performance_fiches
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
  coalesce(f.cout_par_portion, case when f.portions > 0 then f.cout_total / f.portions else null end) as cout,
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
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table if exists fournisseur_produits enable row level security;
alter table if exists fournisseur_produits force row level security;
drop policy if exists fournisseur_produits_all on fournisseur_produits;
create policy fournisseur_produits_all on fournisseur_produits
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

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
alter table if exists achats enable row level security;
alter table if exists achats force row level security;
drop policy if exists achats_all on achats;
create policy achats_all on achats
  for all using (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  with check (mama_id = (select mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

-- Consolidation multi-sites


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


-- Correction manquante : ajout colonne zone_id si absente dans inventaire_lignes
alter table if exists inventaire_lignes
  add column if not exists zone_id uuid references zones_stock(id);


-- Ajout colonne quantite_theorique si absente
ALTER TABLE IF EXISTS inventaire_lignes
  ADD COLUMN IF NOT EXISTS quantite_theorique numeric;



-- Correction manquante : ajout colonne zone_id si absente dans inventaire_lignes
ALTER TABLE IF EXISTS inventaire_lignes
  ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES zones_stock(id);

-- Ajout colonne quantite_theorique si absente
ALTER TABLE IF EXISTS inventaire_lignes
  ADD COLUMN IF NOT EXISTS quantite_theorique numeric;

-- Ajout colonne quantite_reelle si absente
ALTER TABLE IF EXISTS inventaire_lignes
  ADD COLUMN IF NOT EXISTS quantite_reelle numeric;



-- Ajout colonne manquante motif dans inventaire_lignes
ALTER TABLE IF EXISTS inventaire_lignes
  ADD COLUMN IF NOT EXISTS motif text;


create or replace view v_ecarts_inventaire as
select i.mama_id,
       l.produit_id,
       i.date_inventaire as date,
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

-- Recommandations : produits en stock mort
drop view if exists v_reco_stockmort;

create or replace view v_reco_stockmort as
select p.mama_id,
       p.id as produit_id,
       p.nom,
       coalesce(date_part('day', now() - max(sm.date)), 9999) as jours_inactif
from produits p
left join stock_mouvements sm on sm.produit_id = p.id
  and sm.mama_id = p.mama_id and sm.actif is true
where p.mama_id = current_user_mama_id()
group by p.mama_id, p.id, p.nom;

-- Recommandations : surcoût produits
create or replace view v_reco_surcout as
with prix as (
    select fp.mama_id,
           fp.produit_id,
           fp.prix_achat,
           row_number() over (partition by fp.produit_id order by fp.date_livraison desc) rn
    from fournisseur_produits fp
    where fp.actif is true
      and fp.mama_id = current_user_mama_id()
)
select p.mama_id,
       p.id as produit_id,
       p.nom,
       case when prev.prix_achat is null then null
            else round(100 * (last.prix_achat - prev.prix_achat) / prev.prix_achat, 2)
       end as variation_pct
from produits p
join prix last on last.produit_id = p.id and last.rn = 1
left join prix prev on prev.produit_id = p.id and prev.rn = 2
where p.mama_id = current_user_mama_id();

-- Tendance prix par produit
create or replace view v_tendance_prix_produit as
select f.mama_id,
       fl.produit_id,
       to_char(date_trunc('month', f.date_facture),'YYYY-MM') as mois,
       avg(fl.prix_unitaire) as prix_moyen
from factures f
join facture_lignes fl on fl.facture_id = f.id
where f.actif = true
  and fl.actif = true
  and f.mama_id = current_user_mama_id()
group by f.mama_id, fl.produit_id, to_char(date_trunc('month', f.date_facture),'YYYY-MM');

-- Agrégation mensuelle par centre de coût
create or replace view v_cost_center_monthly as
select mc.mama_id,
       cc.nom,
       to_char(date_trunc('month', mc.created_at),'YYYY-MM') as mois,
       sum(coalesce(mc.valeur,0)) as montant
from mouvements_centres_cout mc
join centres_de_cout cc on cc.id = mc.centre_cout_id
where mc.actif = true
  and cc.actif = true
  and mc.mama_id = current_user_mama_id()
group by mc.mama_id, cc.nom, to_char(date_trunc('month', mc.created_at),'YYYY-MM');

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

-- Module Tableau de bord gadgets personnalisable
create table if not exists gadgets (
  id uuid primary key default gen_random_uuid(),
  type text,
  nom text,
  configuration_json jsonb,
  mama_id uuid references mamas(id),
  actif boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_gadgets_mama_id on gadgets(mama_id);
create index if not exists idx_gadgets_actif on gadgets(actif);

create table if not exists tableaux_de_bord (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  liste_gadgets_json jsonb,
  mama_id uuid references mamas(id),
  created_at timestamptz default now()
);
create unique index if not exists uniq_tableaux_de_bord_user on tableaux_de_bord(utilisateur_id, mama_id);
create index if not exists idx_tableaux_de_bord_mama_id on tableaux_de_bord(mama_id);

-- Journaux utilisateur (logs activite)
create table if not exists journaux_utilisateur (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  action text,
  page text,
  ip text,
  date_action timestamptz default now(),
  mama_id uuid references mamas(id)
);
create index if not exists idx_journaux_utilisateur_mama on journaux_utilisateur(mama_id);
alter table if exists journaux_utilisateur
  add column if not exists utilisateur_id uuid references utilisateurs(id),
  add column if not exists page text,
  add column if not exists ip text,
  add column if not exists date_action timestamptz;

-- Logs securite
create table if not exists logs_securite (
  id uuid primary key default gen_random_uuid(),
  type_evenement text,
  details jsonb,
  date_evenement timestamptz default now(),
  niveau_criticite text,
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id)
);
create index if not exists idx_logs_securite_mama on logs_securite(mama_id);
alter table if exists logs_securite
  add column if not exists type_evenement text,
  add column if not exists details jsonb,
  add column if not exists date_evenement timestamptz,
  add column if not exists niveau_criticite text,
  add column if not exists utilisateur_id uuid references utilisateurs(id);

-- Vue calculant le stock par produit
create or replace view v_stocks as
select
  m.mama_id,
  m.produit_id,
  sum(coalesce(m.entree, 0) - coalesce(m.sortie, 0)) as stock
from mouvements_stock m
where m.actif = true
group by m.mama_id, m.produit_id;

-- Vue de statistiques consolidées avec stock cumulé
create or replace view v_consolidated_stats as
select
  s.mama_id,
  count(distinct s.produit_id) as total_produits,
  sum(s.stock) as stock_total
from v_stocks s
group by s.mama_id;

-- Ajout de la colonne manquante 'portions' dans fiches_techniques
ALTER TABLE IF EXISTS fiches_techniques
  ADD COLUMN IF NOT EXISTS portions numeric;

-- Ajout de la colonne 'cout_par_portion' si absente
ALTER TABLE IF EXISTS fiches_techniques
  ADD COLUMN IF NOT EXISTS cout_par_portion numeric;

-- Ajout de la colonne 'nom' si absente
ALTER TABLE IF EXISTS fiches_techniques
  ADD COLUMN IF NOT EXISTS nom text;

-- Création ou remplacement de la vue v_performance_fiches