-- SQL additions and fixes for module inter-connections
-- Ensure automatic stock updates when purchases or deliveries are inserted

-- Trigger wrapper for invoices
CREATE OR REPLACE FUNCTION trg_apply_stock_facture()
RETURNS trigger AS $$
BEGIN
  PERFORM apply_stock_from_achat(NEW.id, 'factures', NEW.mama_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apply_stock_facture ON factures;
CREATE TRIGGER trg_apply_stock_facture
AFTER INSERT ON factures
FOR EACH ROW EXECUTE FUNCTION trg_apply_stock_facture();

-- Trigger wrapper for delivery notes
CREATE OR REPLACE FUNCTION trg_apply_stock_bl()
RETURNS trigger AS $$
BEGIN
  PERFORM apply_stock_from_achat(NEW.id, 'bons_livraison', NEW.mama_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apply_stock_bl ON bons_livraison;
CREATE TRIGGER trg_apply_stock_bl
AFTER INSERT ON bons_livraison
FOR EACH ROW EXECUTE FUNCTION trg_apply_stock_bl();

-- TODO: add similar triggers for deletions and status changes when required
-- TODO: create triggers for fiches_lignes, inventaire_lignes and transfert_lignes
--       to keep stock_theorique, consommation, dernier_prix, and PMP up to date
