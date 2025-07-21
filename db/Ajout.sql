-- Mise à jour module Factures
-- Calcul automatique des totaux à chaque modification de ligne
create or replace function update_facture_totals() returns trigger as $$
begin
  update factures
  set total_ht = coalesce((select sum(quantite * prix_unitaire) from facture_lignes where facture_id = coalesce(new.facture_id, old.facture_id) and actif = true),0),
      total_tva = coalesce((select sum(quantite * prix_unitaire * coalesce(tva,0)/100) from facture_lignes where facture_id = coalesce(new.facture_id, old.facture_id) and actif = true),0),
      total_ttc = coalesce((select sum(quantite * prix_unitaire * (1 + coalesce(tva,0)/100)) from facture_lignes where facture_id = coalesce(new.facture_id, old.facture_id) and actif = true),0),
      montant_total = coalesce((select sum(quantite * prix_unitaire * (1 + coalesce(tva,0)/100)) from facture_lignes where facture_id = coalesce(new.facture_id, old.facture_id) and actif = true),0)
  where id = coalesce(new.facture_id, old.facture_id);
  return new;
end;
$$ language plpgsql;

create trigger trg_facture_lignes_totals
  after insert or update or delete on facture_lignes
  for each row execute procedure update_facture_totals();

-- Historique des achats
create or replace function insert_achat_from_facture_line() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into achats(mama_id, produit_id, supplier_id, prix, quantite, date_achat)
    values(new.mama_id, new.produit_id,
           (select fournisseur_id from factures where id = new.facture_id),
           new.prix_unitaire, new.quantite,
           (select date_facture from factures where id = new.facture_id));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_facture_lignes_achats
  after insert on facture_lignes
  for each row execute procedure insert_achat_from_facture_line();

-- Module fiches techniques : support des sous-fiches
alter table if exists fiche_lignes
  add column if not exists sous_fiche_id uuid references fiches_techniques(id);
create index if not exists idx_fiche_lignes_sous_fiche_id
  on fiche_lignes(sous_fiche_id);

-- Inventaire : ajout colonne actif manquante et RLS
alter table if exists inventaire_zones
  add column if not exists actif boolean default true;

create index if not exists idx_inventaires_date_inventaire
  on inventaires(date_inventaire);
create index if not exists idx_inventaires_date_debut
  on inventaires(date_debut);
create index if not exists idx_inventaire_lignes_inventaire_id
  on inventaire_lignes(inventaire_id);

alter table if exists inventaires enable row level security;
alter table if exists inventaires force row level security;
drop policy if exists inventaires_all on inventaires;
create policy inventaires_all on inventaires
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Module Requisitions Simulation
alter table if exists requisitions
  add column if not exists utilisateur_id uuid references utilisateurs(id),
  add column if not exists zone_id uuid references zones_stock(id),
  add column if not exists date_demande date,
  add column if not exists statut text default 'brouillon';

alter table if exists requisitions enable row level security;
alter table if exists requisitions force row level security;
drop policy if exists requisitions_all on requisitions;
create policy requisitions_all on requisitions
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create table if not exists requisition_lignes (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id),
  requisition_id uuid not null references requisitions(id),
  produit_id uuid not null references produits(id),
  quantite_demandee numeric,
  stock_theorique_avant numeric,
  stock_theorique_apres numeric,
  commentaire text,
  actif boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create index if not exists idx_requisition_lignes_mama_id on requisition_lignes(mama_id);
create index if not exists idx_requisition_lignes_requisition_id on requisition_lignes(requisition_id);

alter table if exists requisition_lignes enable row level security;
alter table if exists requisition_lignes force row level security;
drop policy if exists requisition_lignes_all on requisition_lignes;
create policy requisition_lignes_all on requisition_lignes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create or replace function set_requisition_stock_theorique() returns trigger as $$
declare
  current_stock numeric;
  zid uuid;
begin
  select zone_id into zid from requisitions where id = new.requisition_id;
  select quantite into current_stock from stocks
    where mama_id = new.mama_id and zone_id = zid and produit_id = new.produit_id;
  new.stock_theorique_avant := coalesce(current_stock,0);
  new.stock_theorique_apres := coalesce(current_stock,0) - coalesce(new.quantite_demandee,0);
  return new;
end;
$$ language plpgsql;

create trigger trg_requisition_lignes_stock
  before insert on requisition_lignes
  for each row execute procedure set_requisition_stock_theorique();

create or replace view v_requisition_stock as
select rl.id as ligne_id,
       rl.requisition_id,
       r.zone_id,
       rl.produit_id,
       rl.stock_theorique_avant as stock_reel,
       rl.quantite_demandee,
       rl.stock_theorique_apres as stock_apres,
       rl.mama_id
from requisition_lignes rl
join requisitions r on r.id = rl.requisition_id
where rl.actif is true and r.actif is true;

alter table if exists inventaire_lignes enable row level security;
alter table if exists inventaire_lignes force row level security;
drop policy if exists inventaire_lignes_all on inventaire_lignes;
create policy inventaire_lignes_all on inventaire_lignes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table if exists inventaire_zones enable row level security;
alter table if exists inventaire_zones force row level security;
drop policy if exists inventaire_zones_all on inventaire_zones;
create policy inventaire_zones_all on inventaire_zones
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Sécurisation des établissements
alter table if exists mamas enable row level security;
alter table if exists mamas force row level security;
drop policy if exists mamas_all on mamas;
create policy mamas_all on mamas
  for all using (id = current_user_mama_id())
  with check (id = current_user_mama_id());

-- Création du RPC pour appliquer les mouvements de stock à partir d'un achat
create or replace function apply_stock_from_achat(achat_id uuid, achat_table text, mama uuid)
returns void as $$
declare
  r record;
begin
  if achat_table = 'factures' then
    for r in
      select fl.produit_id, fl.quantite
      from facture_lignes fl
      join factures f on f.id = fl.facture_id
      where f.id = achat_id and f.mama_id = mama and fl.actif is true
    loop
      insert into stock_mouvements(mama_id, date, type, quantite, produit_id)
      values (mama, now(), 'entree_achat', r.quantite, r.produit_id);
    end loop;
  elsif achat_table = 'bons_livraison' then
    for r in
      select l.produit_id, l.quantite_recue as quantite
      from lignes_bl l
      join bons_livraison b on b.id = l.bl_id
      where b.id = achat_id and b.mama_id = mama
    loop
      insert into stock_mouvements(mama_id, date, type, quantite, produit_id)
      values (mama, now(), 'entree_achat', r.quantite, r.produit_id);
    end loop;
  end if;
end;
$$ language plpgsql security definer;

grant execute on function apply_stock_from_achat(uuid, text, uuid) to authenticated;

-- ============================================================================
-- Alignement module Paramétrage & Utilisateurs

-- Ajout des colonnes manquantes pour la table utilisateurs
alter table if exists utilisateurs
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists invite_pending boolean default false;
create index if not exists idx_utilisateurs_email on utilisateurs(email);

-- Ajout des colonnes manquantes pour la table roles
alter table if exists roles
  add column if not exists description text,
  add column if not exists access_rights jsonb default '[]'::jsonb;

-- Ajout colonne ville pour les établissements
alter table if exists mamas
  add column if not exists ville text;

-- Activation RLS et policies pour les tables sensibles
alter table if exists utilisateurs enable row level security;
alter table if exists utilisateurs force row level security;
drop policy if exists utilisateurs_all on utilisateurs;
create policy utilisateurs_all on utilisateurs
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table if exists roles enable row level security;
alter table if exists roles force row level security;
drop policy if exists roles_all on roles;
create policy roles_all on roles
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table if exists permissions enable row level security;
alter table if exists permissions force row level security;
drop policy if exists permissions_all on permissions;
create policy permissions_all on permissions
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table if exists access_rights enable row level security;
alter table if exists access_rights force row level security;
drop policy if exists access_rights_all on access_rights;
create policy access_rights_all on access_rights
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Mise à jour Zones de stock : colonnes et sécurité RLS
alter table if exists zones_stock
  add column if not exists description text,
  add column if not exists type_zone text;

create index if not exists idx_zones_stock_nom on zones_stock(nom);

alter table if exists zones_stock enable row level security;
alter table if exists zones_stock force row level security;
drop policy if exists zones_stock_all on zones_stock;
create policy zones_stock_all on zones_stock
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Module Dashboard : tables, vues et fonctions complementaires

-- Colonnes manquantes pour la table gadgets
alter table if exists gadgets
  add column if not exists nom text,
  add column if not exists ordre integer default 0,
  add column if not exists configuration_json jsonb;

-- RLS pour gadgets
alter table if exists gadgets enable row level security;
alter table if exists gadgets force row level security;
drop policy if exists gadgets_all on gadgets;
create policy gadgets_all on gadgets
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- RLS pour tableaux_de_bord
alter table if exists tableaux_de_bord enable row level security;
alter table if exists tableaux_de_bord force row level security;
drop policy if exists tableaux_de_bord_all on tableaux_de_bord;
create policy tableaux_de_bord_all on tableaux_de_bord
  for all using (
    mama_id = current_user_mama_id() and
    utilisateur_id = (select id from utilisateurs where auth_id = auth.uid())
  )
  with check (
    mama_id = current_user_mama_id() and
    utilisateur_id = (select id from utilisateurs where auth_id = auth.uid())
  );

-- RLS pour notifications
alter table if exists notifications enable row level security;
alter table if exists notifications force row level security;
drop policy if exists notifications_all on notifications;
create policy notifications_all on notifications
  for all using (
    mama_id = current_user_mama_id() and
    (user_id = auth.uid() or utilisateur_id = (select id from utilisateurs where auth_id = auth.uid()))
  )
  with check (
    mama_id = current_user_mama_id() and
    (user_id = auth.uid() or utilisateur_id = (select id from utilisateurs where auth_id = auth.uid()))
  );

-- RLS pour journaux_utilisateur
alter table if exists journaux_utilisateur enable row level security;
alter table if exists journaux_utilisateur force row level security;
drop policy if exists journaux_utilisateur_all on journaux_utilisateur;
create policy journaux_utilisateur_all on journaux_utilisateur
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- RLS pour logs_securite
alter table if exists logs_securite enable row level security;
alter table if exists logs_securite force row level security;
drop policy if exists logs_securite_all on logs_securite;
create policy logs_securite_all on logs_securite
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- Vue produits avec dernier prix et informations stock
create or replace view v_produits_dernier_prix as
select
  p.id,
  p.nom,
  p.famille,
  p.unite,
  p.stock_reel,
  p.stock_min,
  fp.fournisseur_id,
  f.nom as fournisseur,
  fp.prix_achat as dernier_prix,
  fp.date_livraison,
  p.mama_id
from produits p
left join lateral (
  select fp2.fournisseur_id, fp2.prix_achat, fp2.date_livraison
  from fournisseur_produits fp2
  where fp2.produit_id = p.id and fp2.mama_id = p.mama_id
  order by fp2.date_livraison desc
  limit 1
) fp on true
left join fournisseurs f on f.id = fp.fournisseur_id;

-- Fonction de calcul budget mensuel simplifie
create or replace function fn_calc_budgets(mama_id_param uuid, periode_param text)
returns table(famille text, budget numeric, reel numeric, ecart_pct numeric)
as $$
declare
  d1 date := to_date(periode_param || '-01', 'YYYY-MM-DD');
  d2 date := (d1 + interval '1 month');
begin
  return query
  select p.famille,
         0::numeric as budget,
         sum(fl.prix_unitaire * fl.quantite) as reel,
         null::numeric as ecart_pct
  from factures f
  join facture_lignes fl on fl.facture_id = f.id
  join produits p on p.id = fl.produit_id
  where f.mama_id = mama_id_param
    and f.date_facture >= d1
    and f.date_facture < d2
    and f.actif is true
    and fl.actif is true
  group by p.famille;
end;
$$ language plpgsql security definer;
grant execute on function fn_calc_budgets(uuid, text) to authenticated;

-- Fonction dashboard_stats pour page Stocks
create or replace function dashboard_stats(
  mama_id_param uuid,
  page_param integer default 1,
  page_size_param integer default 30
) returns table(produit_id uuid, nom text, stock_reel numeric, pmp numeric, last_purchase date)
as $$
begin
  return query
  select p.id, p.nom, p.stock_reel,
         coalesce(vp.pmp,0) as pmp,
         (select max(f.date_facture)
            from factures f
            join facture_lignes fl on fl.facture_id = f.id and fl.produit_id = p.id
           where f.mama_id = mama_id_param) as last_purchase
  from produits p
  left join v_pmp vp on vp.produit_id = p.id and vp.mama_id = mama_id_param
  where p.mama_id = mama_id_param
  order by p.nom
  limit page_size_param offset (page_param-1)*page_size_param;
end;
$$ language plpgsql security definer;
grant execute on function dashboard_stats(uuid, integer, integer) to authenticated;

-- Fonction top_produits pour recommandations
create or replace function top_produits(
  mama_id_param uuid,
  debut_param date default null,
  fin_param date default null,
  limit_param integer default 5
) returns table(produit_id uuid, nom text, total numeric)
as $$
begin
  return query
  select p.id, p.nom,
         sum(sm.quantite) as total
  from stock_mouvements sm
  join produits p on p.id = sm.produit_id
  where sm.mama_id = mama_id_param
    and sm.type = 'sortie'
    and (debut_param is null or sm.date >= debut_param)
    and (fin_param is null or sm.date < fin_param + interval '1 day')
  group by p.id, p.nom
  order by total desc
  limit limit_param;
end;
$$ language plpgsql security definer;
grant execute on function top_produits(uuid, date, date, integer) to authenticated;

-- Mouvements sans centre de cout
create or replace function mouvements_without_alloc(limit_param integer)
returns table(id uuid, produit_id uuid, quantite numeric, valeur numeric, mama_id uuid, date timestamp with time zone)
language sql security definer as $$
  select sm.id, sm.produit_id, sm.quantite, sm.valeur, sm.mama_id, sm.date
  from stock_mouvements sm
  left join mouvements_centres_cout mc on mc.mouvement_id = sm.id
  where mc.id is null
  order by sm.date desc
  limit limit_param
$$;
grant execute on function mouvements_without_alloc(integer) to authenticated;

-- ===========================================================================
-- Menu Engineering: index, RLS and analytical view

create index if not exists idx_ventes_fiches_carte_periode
  on ventes_fiches_carte(periode);

alter table if exists ventes_fiches_carte enable row level security;
alter table if exists ventes_fiches_carte force row level security;
drop policy if exists ventes_fiches_carte_all on ventes_fiches_carte;
create policy ventes_fiches_carte_all on ventes_fiches_carte
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

create or replace view v_menu_engineering as
select f.id as fiche_id,
       f.nom,
       f.famille,
       f.prix_vente,
       coalesce(f.cout_par_portion, 0) as cout_portion,
       v.periode,
       coalesce(v.ventes, 0) as ventes,
       round(coalesce(v.ventes,0)::numeric /
             nullif(sum(v.ventes) over(partition by f.mama_id, v.periode),0), 4) as popularite,
       round(100 * (f.prix_vente - coalesce(f.cout_par_portion,0)) /
             nullif(f.prix_vente,0), 2) as marge,
       f.mama_id
from fiches_techniques f
left join ventes_fiches_carte v
  on v.fiche_id = f.id and v.mama_id = f.mama_id
where f.actif = true;

-- ===========================================================================
-- Mise a jour module Carte : colonnes manquantes et RLS

alter table if exists fiches_techniques
  add column if not exists famille text,
  add column if not exists type_carte text,
  add column if not exists sous_type_carte text,
  add column if not exists prix_vente numeric,
  add column if not exists carte_actuelle boolean default false,
  add column if not exists cout_total numeric,
  add column if not exists cout_portion numeric,
  add column if not exists rendement numeric default 1;

create index if not exists idx_fiches_techniques_carte_actuelle
  on fiches_techniques(carte_actuelle);

alter table if exists fiches_techniques enable row level security;
alter table if exists fiches_techniques force row level security;
drop policy if exists fiches_techniques_all on fiches_techniques;
create policy fiches_techniques_all on fiches_techniques
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

-- ===========================================================================
-- Module Cost Boisson : liaison produits <-> fiches techniques et vue dediee

alter table if exists produits
  add column if not exists fiche_technique_id uuid references fiches_techniques(id),
  add column if not exists prix_vente numeric;

create index if not exists idx_produits_fiche_technique_id
  on produits(fiche_technique_id);

create or replace view v_boissons as
select p.id,
       p.nom,
       p.prix_vente,
       p.created_at,
       p.mama_id,
       coalesce(ft.famille, fam.nom) as famille,
       u.nom as unite,
       p.fiche_technique_id as fiche_id,
       case when p.fiche_technique_id is not null
            then ft.cout_par_portion
            else p.pmp end as cout_portion
from produits p
left join familles fam on fam.id = p.famille_id
left join unites u on u.id = p.unite_id
left join fiches_techniques ft on ft.id = p.fiche_technique_id
where p.actif = true
  and (coalesce(ft.famille, fam.nom) ilike '%boisson%');

-- ===========================================================================
-- Module Menu du Jour : tables dédiées et RLS

create table if not exists menus_jour (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id),
  nom text not null,
  date date not null,
  prix_vente_ttc numeric,
  tva numeric default 5.5,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  actif boolean default true
);

create index if not exists idx_menus_jour_mama_id on menus_jour(mama_id);

create table if not exists menus_jour_fiches (
  id uuid primary key default gen_random_uuid(),
  menu_jour_id uuid not null references menus_jour(id),
  fiche_id uuid not null references fiches_techniques(id),
  mama_id uuid not null references mamas(id),
  quantite numeric default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  actif boolean default true
);

create index if not exists idx_menus_jour_fiches_menu_id on menus_jour_fiches(menu_jour_id);
create index if not exists idx_menus_jour_fiches_fiche_id on menus_jour_fiches(fiche_id);
create index if not exists idx_menus_jour_fiches_mama_id on menus_jour_fiches(mama_id);

alter table if exists menus_jour enable row level security;
alter table if exists menus_jour force row level security;
drop policy if exists menus_jour_all on menus_jour;
create policy menus_jour_all on menus_jour
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table if exists menus_jour_fiches enable row level security;
alter table if exists menus_jour_fiches force row level security;
drop policy if exists menus_jour_fiches_all on menus_jour_fiches;
create policy menus_jour_fiches_all on menus_jour_fiches
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
-- Module Taches : liaison utilisateurs et RLS
alter table if exists taches
  add column if not exists utilisateur_id uuid references utilisateurs(id);
create index if not exists idx_taches_utilisateur_id on taches(utilisateur_id);

create table if not exists tache_assignations (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id),
  tache_id uuid not null references taches(id),
  utilisateur_id uuid not null references utilisateurs(id),
  statut text default 'a_faire',
  commentaire text,
  date_realisation timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  actif boolean default true
);
create index if not exists idx_tache_assignations_mama_id on tache_assignations(mama_id);
create index if not exists idx_tache_assignations_tache_id on tache_assignations(tache_id);

alter table if exists taches enable row level security;
alter table if exists taches force row level security;
drop policy if exists taches_all on taches;
create policy taches_all on taches
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table if exists tache_assignations enable row level security;
alter table if exists tache_assignations force row level security;
drop policy if exists tache_assignations_all on tache_assignations;
create policy tache_assignations_all on tache_assignations
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table if exists tache_instances enable row level security;
alter table if exists tache_instances force row level security;
drop policy if exists tache_instances_all on tache_instances;
create policy tache_instances_all on tache_instances
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());
