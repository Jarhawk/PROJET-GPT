-- Schema rename script to switch to French naming
-- Run this after importing full_setup.sql

-- Tables
ALTER TABLE supplier_products      RENAME TO fournisseur_produits;
ALTER TABLE cost_centers           RENAME TO centres_de_cout;
ALTER TABLE mouvement_cost_centers RENAME TO mouvements_centres_cout;
ALTER TABLE user_logs              RENAME TO journaux_utilisateur;
ALTER TABLE audit_logs             RENAME TO journaux_audit;
ALTER TABLE promotion_products     RENAME TO promotion_produits;
ALTER TABLE dashboards             RENAME TO tableaux_de_bord;
ALTER TABLE widgets                RENAME TO gadgets;

-- Columns
ALTER TABLE products
  RENAME COLUMN main_supplier_id TO fournisseur_principal_id;

-- Rename products table itself
ALTER TABLE products RENAME TO produits;

-- Update dependent columns referencing products
ALTER TABLE fournisseur_produits RENAME COLUMN product_id TO produit_id;
ALTER TABLE mouvements_stock RENAME COLUMN product_id TO produit_id;
ALTER TABLE facture_lignes  RENAME COLUMN product_id TO produit_id;
ALTER TABLE fiche_lignes    RENAME COLUMN product_id TO produit_id;
ALTER TABLE inventaire_lignes RENAME COLUMN product_id TO produit_id;
ALTER TABLE promotion_produits RENAME COLUMN product_id TO produit_id;

-- Views
DROP VIEW IF EXISTS v_products_last_price;
CREATE OR REPLACE VIEW v_produits_dernier_prix AS
SELECT
  p.id,
  p.nom,
  p.famille,
  p.unite,
  fp.prix_achat      AS dernier_prix,
  fp.date_livraison  AS date_dernier_prix,
  fp.fournisseur_id  AS dernier_fournisseur_id
FROM produits p
LEFT JOIN LATERAL (
    SELECT prix_achat, date_livraison, fournisseur_id
    FROM fournisseur_produits
    WHERE produit_id = p.id
    ORDER BY date_livraison DESC
    LIMIT 1
) fp ON TRUE;

-- Indexes
ALTER INDEX IF EXISTS idx_supplier_products_mama RENAME TO idx_fournisseur_produits_mama;
ALTER INDEX IF EXISTS idx_supplier_products_product RENAME TO idx_fournisseur_produits_produit;
ALTER INDEX IF EXISTS idx_supplier_products_fournisseur RENAME TO idx_fournisseur_produits_fournisseur;
ALTER INDEX IF EXISTS idx_supplier_products_product_date RENAME TO idx_fournisseur_produits_produit_date;

-- Indexes for produits table and related foreign keys
ALTER INDEX IF EXISTS idx_products_mama RENAME TO idx_produits_mama;
ALTER INDEX IF EXISTS idx_products_nom RENAME TO idx_produits_nom;
ALTER INDEX IF EXISTS idx_products_actif RENAME TO idx_produits_actif;
ALTER INDEX IF EXISTS idx_products_famille RENAME TO idx_produits_famille;
ALTER INDEX IF EXISTS idx_products_unite RENAME TO idx_produits_unite;
ALTER INDEX IF EXISTS idx_products_main_supplier RENAME TO idx_produits_fournisseur_principal;
ALTER INDEX IF EXISTS idx_products_famille_txt RENAME TO idx_produits_famille_txt;
ALTER INDEX IF EXISTS idx_products_unite_txt RENAME TO idx_produits_unite_txt;
ALTER INDEX IF EXISTS idx_products_code RENAME TO idx_produits_code;
ALTER INDEX IF EXISTS idx_mouvements_product RENAME TO idx_mouvements_produit;
ALTER INDEX IF EXISTS idx_mouvements_stock_product RENAME TO idx_mouvements_stock_produit;
ALTER INDEX IF EXISTS idx_facture_lignes_product RENAME TO idx_facture_lignes_produit;
ALTER INDEX IF EXISTS idx_fiche_lignes_product RENAME TO idx_fiche_lignes_produit;
ALTER INDEX IF EXISTS idx_inventaire_lignes_product RENAME TO idx_inventaire_lignes_produit;
ALTER INDEX IF EXISTS idx_promo_prod_product RENAME TO idx_promo_prod_produit;
ALTER INDEX IF EXISTS idx_pertes_product RENAME TO idx_pertes_produit;
ALTER INDEX IF EXISTS idx_cost_centers_mama RENAME TO idx_centres_cout_mama;
ALTER INDEX IF EXISTS idx_cost_centers_nom RENAME TO idx_centres_cout_nom;
ALTER INDEX IF EXISTS idx_mouvement_cc_mama RENAME TO idx_mouvements_cc_mama;
ALTER INDEX IF EXISTS idx_mouvement_cc_mouvement RENAME TO idx_mouvements_cc_mouvement;
ALTER INDEX IF EXISTS idx_mouvement_cc_cc RENAME TO idx_mouvements_cc_centre;
ALTER INDEX IF EXISTS idx_user_logs_mama RENAME TO idx_journaux_utilisateur_mama;
ALTER INDEX IF EXISTS idx_user_logs_user RENAME TO idx_journaux_utilisateur_user;
ALTER INDEX IF EXISTS idx_user_logs_done RENAME TO idx_journaux_utilisateur_done;
ALTER INDEX IF EXISTS idx_user_logs_date RENAME TO idx_journaux_utilisateur_date;

-- Triggers & functions
DROP FUNCTION IF EXISTS update_product_pmp();
CREATE OR REPLACE FUNCTION mettre_a_jour_pmp_produit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE produits
    SET pmp = ((coalesce(pmp,0) * stock_reel) + (NEW.quantite * NEW.prix_unitaire)) / NULLIF(stock_reel + NEW.quantite,0),
        stock_reel = stock_reel + NEW.quantite
  WHERE id = NEW.produit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_facture_ligne ON facture_lignes;
CREATE TRIGGER trg_facture_ligne
AFTER INSERT ON facture_lignes
FOR EACH ROW EXECUTE FUNCTION mettre_a_jour_pmp_produit();

-- Cost center views using French table names
DROP VIEW IF EXISTS v_cost_center_totals;
CREATE OR REPLACE VIEW v_centres_cout_totaux AS
SELECT
  c.mama_id,
  c.id AS centre_cout_id,
  c.nom,
  coalesce(sum(m.quantite),0) AS quantite_totale,
  coalesce(sum(m.valeur),0) AS valeur_totale
FROM centres_de_cout c
LEFT JOIN mouvements_centres_cout m ON m.centre_de_cout_id = c.id
GROUP BY c.mama_id, c.id, c.nom;

DROP VIEW IF EXISTS v_cost_center_monthly;
CREATE OR REPLACE VIEW v_centres_cout_mensuel AS
SELECT
  c.mama_id,
  c.id AS centre_cout_id,
  date_trunc('month', m.created_at) AS mois,
  c.nom,
  coalesce(sum(m.quantite),0) AS quantite,
  coalesce(sum(m.valeur),0) AS valeur
FROM centres_de_cout c
LEFT JOIN mouvements_centres_cout m ON m.centre_de_cout_id = c.id
GROUP BY c.mama_id, c.id, mois, c.nom;

DROP VIEW IF EXISTS v_cost_center_month;
CREATE OR REPLACE VIEW v_centre_cout_mois AS
SELECT * FROM v_centres_cout_mensuel;

DROP VIEW IF EXISTS v_ventilation;
CREATE OR REPLACE VIEW v_ventilation AS
SELECT
  mc.mama_id,
  mc.mouvement_id,
  m.date,
  m.produit_id,
  mc.centre_de_cout_id,
  cc.nom AS centre_de_cout,
  mc.quantite,
  mc.valeur
FROM mouvements_centres_cout mc
JOIN mouvements_stock m ON m.id = mc.mouvement_id
JOIN centres_de_cout cc ON cc.id = mc.centre_de_cout_id;

-- Replace suggest_cost_centers with French column names
DROP FUNCTION IF EXISTS suggest_cost_centers(uuid);
CREATE OR REPLACE FUNCTION suggest_cost_centers(p_produit_id uuid)
RETURNS TABLE(centre_de_cout_id uuid, nom text, ratio numeric)
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT
    mcc.centre_de_cout_id,
    cc.nom,
    SUM(mcc.quantite)::numeric / GREATEST(SUM(sum_mcc.quantite),1) AS ratio
  FROM mouvements_centres_cout mcc
  JOIN mouvements_stock ms ON ms.id = mcc.mouvement_id
  JOIN centres_de_cout cc ON cc.id = mcc.centre_de_cout_id
  JOIN (
    SELECT SUM(ABS(m.quantite)) AS quantite
    FROM mouvements_stock m
    WHERE m.produit_id = p_produit_id
      AND m.mama_id = current_user_mama_id()
      AND m.quantite < 0
  ) sum_mcc ON TRUE
  WHERE ms.produit_id = p_produit_id
    AND ms.mama_id = current_user_mama_id()
    AND ms.quantite < 0
  GROUP BY mcc.centre_de_cout_id, cc.nom;
$$;
GRANT EXECUTE ON FUNCTION suggest_cost_centers(uuid) TO authenticated;

