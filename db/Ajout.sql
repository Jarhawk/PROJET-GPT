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
