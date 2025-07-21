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
