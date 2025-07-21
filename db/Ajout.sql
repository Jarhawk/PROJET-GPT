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
