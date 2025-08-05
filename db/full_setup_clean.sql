CREATE OR REPLACE FUNCTION current_user_mama_id()
RETURNS uuid AS $$
  SELECT mama_id FROM utilisateurs WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_unite_delete()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM produits WHERE unite_id = OLD.id AND actif IS TRUE) THEN
    RAISE EXCEPTION 'Unité utilisée par des produits';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_requisition_stock_theorique()
RETURNS trigger AS $$
DECLARE
  current_stock numeric;
  zid uuid;
BEGIN
  SELECT zone_id INTO zid FROM requisitions WHERE id = NEW.requisition_id;
  SELECT quantite INTO current_stock FROM stocks
    WHERE mama_id = NEW.mama_id AND zone_id = zid AND produit_id = NEW.produit_id;
  NEW.stock_theorique_avant := COALESCE(current_stock,0);
  NEW.stock_theorique_apres := COALESCE(current_stock,0) - COALESCE(NEW.quantite_demandee,0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_stock_from_transfert_ligne()
RETURNS trigger AS $$
DECLARE
  tr record;
  com text;
BEGIN
  SELECT * INTO tr FROM transferts WHERE id = NEW.transfert_id;
  com := COALESCE(NEW.commentaire, tr.commentaire);
  INSERT INTO stock_mouvements(mama_id, produit_id, quantite, type, date, zone_id, auteur_id, commentaire)
    VALUES(tr.mama_id, NEW.produit_id, -NEW.quantite, 'transfert', tr.date_transfert, tr.zone_source_id, tr.utilisateur_id, com);
  INSERT INTO stock_mouvements(mama_id, produit_id, quantite, type, date, zone_id, auteur_id, commentaire)
    VALUES(tr.mama_id, NEW.produit_id, NEW.quantite, 'transfert', tr.date_transfert, tr.zone_dest_id, tr.utilisateur_id, com);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION apply_stock_from_achat(
  achat_id uuid,
  achat_table text,
  mama_id uuid
)
RETURNS void AS $$
DECLARE
  r record;
BEGIN
  IF achat_table = 'factures' THEN
    FOR r IN
      SELECT fl.produit_id, fl.quantite
      FROM facture_lignes fl
      JOIN factures f ON f.id = fl.facture_id
      WHERE f.id = achat_id AND f.mama_id = mama_id AND fl.actif IS TRUE
    LOOP
      INSERT INTO stock_mouvements(mama_id, date, type, quantite, produit_id)
      VALUES (mama_id, NOW(), 'entree_achat', r.quantite, r.produit_id);
    END LOOP;
  ELSIF achat_table = 'bons_livraison' THEN
    FOR r IN
      SELECT l.produit_id, l.quantite_recue AS quantite
      FROM lignes_bl l
      JOIN bons_livraison b ON b.id = l.bl_id
      WHERE b.id = achat_id AND b.mama_id = mama_id
    LOOP
      INSERT INTO stock_mouvements(mama_id, date, type, quantite, produit_id)
      VALUES (mama_id, NOW(), 'entree_achat', r.quantite, r.produit_id);
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS zones_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid NOT NULL REFERENCES mamas(id) ON DELETE CASCADE,
  nom text NOT NULL,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zones_stock_mama_id ON zones_stock(mama_id);
ALTER TABLE IF EXISTS produits
  ADD COLUMN IF NOT EXISTS zone_stock_id uuid REFERENCES zones_stock(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS produits
  ADD COLUMN IF NOT EXISTS tva numeric DEFAULT 20;
ALTER TABLE IF EXISTS tableaux_de_bord
  ADD COLUMN IF NOT EXISTS liste_gadgets_json jsonb DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS factures
  ADD COLUMN IF NOT EXISTS justificatif text,
  ADD COLUMN IF NOT EXISTS commentaire text,
  ADD COLUMN IF NOT EXISTS bon_livraison text;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'familles' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE familles RENAME COLUMN parent_id TO famille_parent_id;
  END IF;
END $$;
ALTER TABLE IF EXISTS familles
  ADD COLUMN IF NOT EXISTS famille_parent_id uuid REFERENCES familles(id);
INSERT INTO permissions(module, droit)
VALUES
  ('achats','peut_voir'),
  ('bons_livraison','peut_voir'),
  ('planning_previsionnel','peut_voir'),
  ('fiches_techniques','peut_voir'),
  ('stats','peut_voir'),
  ('consolidation','peut_voir'),
  ('menu_engineering','peut_voir'),
  ('zones_stock','peut_voir'),
  ('licences','peut_voir'),
  ('parametrage','peut_voir'),
  ('feedback','peut_voir'),
  ('logs','peut_voir'),
  ('audit','peut_voir'),
  ('dashboard','peut_voir'),
  ('produits','peut_voir'),
  ('fournisseurs','peut_voir'),
  ('factures','peut_voir'),
  ('receptions','peut_voir'),
  ('inventaires','peut_voir'),
  ('mouvements','peut_voir'),
  ('menus','peut_voir'),
  ('carte','peut_voir'),
  ('recettes','peut_voir'),
  ('requisitions','peut_voir'),
  ('promotions','peut_voir'),
  ('notifications','peut_voir'),
  ('documents','peut_voir'),
  ('planning','peut_voir'),
  ('taches','peut_voir'),
  ('alertes','peut_voir'),
  ('analyse','peut_voir'),
  ('reporting','peut_voir'),
  ('utilisateurs','peut_voir'),
  ('roles','peut_voir'),
  ('mamas','peut_voir'),
  ('permissions','peut_voir'),
  ('settings','peut_voir'),
  ('apikeys','peut_voir'),
  ('access','peut_voir'),
  ('aide','peut_voir')
ON CONFLICT DO NOTHING;
ALTER TABLE IF EXISTS factures
  ADD COLUMN IF NOT EXISTS lignes_produits jsonb DEFAULT '[]';
UPDATE factures
SET lignes_produits = '[]'
WHERE lignes_produits IS NULL OR lignes_produits::text = '';
ALTER TABLE IF EXISTS planning_previsionnel
  ADD COLUMN IF NOT EXISTS nom text,
  ADD COLUMN IF NOT EXISTS commentaire text,
  ADD COLUMN IF NOT EXISTS statut text DEFAULT 'prévu',
  ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true;
CREATE TABLE IF NOT EXISTS planning_lignes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid REFERENCES planning_previsionnel(id) ON DELETE CASCADE,
  produit_id uuid REFERENCES produits(id),
  quantite numeric,
  observation text,
  mama_id uuid REFERENCES mamas(id),
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planning_lignes_mama_id ON planning_lignes(mama_id);
ALTER TABLE IF EXISTS planning_previsionnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planning_lignes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS planning_previsionnel_all ON planning_previsionnel;
CREATE POLICY planning_previsionnel_all ON planning_previsionnel
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());
DROP POLICY IF EXISTS planning_lignes_all ON planning_lignes;
CREATE POLICY planning_lignes_all ON planning_lignes
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());
ALTER TABLE IF EXISTS zones_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS zones_stock_all ON zones_stock;
CREATE POLICY zones_stock_all ON zones_stock
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());
CREATE OR REPLACE VIEW v_produits_dernier_prix AS
SELECT
  p.id,
  p.nom,
  p.tva,
  p.famille_id,
  f2.nom AS famille,
  p.unite_id,
  u.nom AS unite,
  p.stock_reel,
  p.stock_min,
  fp.fournisseur_id,
  f.nom AS fournisseur,
  fp.prix_achat AS dernier_prix,
  fp.date_livraison,
  p.mama_id
FROM produits p
LEFT JOIN LATERAL (
  SELECT fp2.fournisseur_id, fp2.prix_achat, fp2.date_livraison
  FROM fournisseur_produits fp2
  WHERE fp2.produit_id = p.id AND fp2.mama_id = p.mama_id
  ORDER BY fp2.date_livraison DESC
  LIMIT 1
) fp ON true
LEFT JOIN fournisseurs f ON f.id = fp.fournisseur_id
LEFT JOIN familles f2 ON f2.id = p.famille_id
LEFT JOIN unites u ON u.id = p.unite_id
WHERE p.actif = true;
ALTER TABLE IF EXISTS produits
  ADD COLUMN IF NOT EXISTS url_photo text;
ALTER TABLE IF EXISTS produits ADD COLUMN IF NOT EXISTS temp_refresh_trigger integer;
ALTER TABLE IF EXISTS produits DROP COLUMN IF EXISTS temp_refresh_trigger;
ALTER TABLE IF EXISTS produits ALTER COLUMN famille_id DROP NOT NULL;
ALTER TABLE IF EXISTS produits ALTER COLUMN famille_id SET NOT NULL;
CREATE OR REPLACE VIEW v_requisitions AS
SELECT
  r.id,
  r.quantite,
  r.date_requisition,
  r.mama_id,
  r.produit_id,
  p.nom AS produit_nom,
  p.url_photo
FROM requisitions r
JOIN produits p ON p.id = r.produit_id;
ALTER TABLE IF EXISTS utilisateurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS utilisateurs_all ON utilisateurs;
CREATE POLICY utilisateurs_all ON utilisateurs
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());
CREATE OR REPLACE VIEW v_evolution_achats AS
SELECT
  a.mama_id,
  date_trunc('month', a.date_achat)::date AS mois,
  SUM(a.prix * a.quantite) AS montant
FROM achats a
WHERE a.actif IS TRUE
GROUP BY a.mama_id, mois
ORDER BY mois;
ALTER TABLE IF EXISTS familles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sous_familles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS unites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS delete_familles ON familles;
CREATE POLICY delete_familles ON familles
  FOR DELETE TO authenticated
  USING (mama_id = current_user_mama_id());
DROP POLICY IF EXISTS delete_sous_familles ON sous_familles;
CREATE POLICY delete_sous_familles ON sous_familles
  FOR DELETE TO authenticated
  USING (mama_id = current_user_mama_id());
DROP POLICY IF EXISTS delete_unites ON unites;
CREATE POLICY delete_unites ON unites
  FOR DELETE TO authenticated
  USING (mama_id = current_user_mama_id());
ALTER TABLE IF EXISTS produits DROP CONSTRAINT IF EXISTS fk_produits_famille;
ALTER TABLE IF EXISTS produits ADD CONSTRAINT fk_produits_famille
  FOREIGN KEY (famille_id) REFERENCES familles(id)
  ON DELETE SET NULL;
ALTER TABLE IF EXISTS produits DROP CONSTRAINT IF EXISTS fk_produits_sous_famille;
ALTER TABLE IF EXISTS produits ADD CONSTRAINT fk_produits_sous_famille
  FOREIGN KEY (sous_famille_id) REFERENCES sous_familles(id)
  ON DELETE SET NULL;
ALTER TABLE IF EXISTS produits DROP CONSTRAINT IF EXISTS fk_produits_unite;
ALTER TABLE IF EXISTS produits ADD CONSTRAINT fk_produits_unite
  FOREIGN KEY (unite_id) REFERENCES unites(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  chemin text,
  type text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_mama_id ON documents(mama_id);
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_all ON documents;
CREATE POLICY documents_all ON documents
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  titre text,
  texte text,
  lien text,
  type text,
  lu boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  actif boolean DEFAULT true,
  utilisateur_id uuid REFERENCES utilisateurs(id)
);
CREATE INDEX IF NOT EXISTS idx_notifications_mama_id ON notifications(mama_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(utilisateur_id);
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_all ON notifications;
CREATE POLICY notifications_all ON notifications
  FOR ALL USING ((mama_id = current_user_mama_id()) AND ((user_id = auth.uid()) OR (utilisateur_id = (SELECT utilisateurs.id FROM utilisateurs WHERE utilisateurs.auth_id = auth.uid()))))
  WITH CHECK ((mama_id = current_user_mama_id()) AND ((user_id = auth.uid()) OR (utilisateur_id = (SELECT utilisateurs.id FROM utilisateurs WHERE utilisateurs.auth_id = auth.uid()))));

CREATE OR REPLACE VIEW v_notifications_non_lues AS
SELECT utilisateur_id, mama_id, COUNT(*) AS total_non_lues
FROM notifications
WHERE lu IS FALSE AND actif IS TRUE
GROUP BY utilisateur_id, mama_id;

CREATE TABLE IF NOT EXISTS gadgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tableau_id uuid REFERENCES tableaux_de_bord(id),
  type text,
  config jsonb,
  created_at timestamptz DEFAULT now(),
  mama_id uuid,
  actif boolean DEFAULT true,
  nom text,
  ordre integer DEFAULT 0,
  configuration_json jsonb
);
CREATE INDEX IF NOT EXISTS idx_gadgets_mama_id ON gadgets(mama_id);
CREATE INDEX IF NOT EXISTS idx_gadgets_actif ON gadgets(actif);
ALTER TABLE IF EXISTS gadgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gadgets_all ON gadgets;
CREATE POLICY gadgets_all ON gadgets
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

DROP TRIGGER IF EXISTS trg_unites_updated_at ON unites;
CREATE TRIGGER trg_unites_updated_at
  BEFORE UPDATE ON unites
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_unite_delete ON unites;
CREATE TRIGGER trg_unite_delete
  BEFORE DELETE ON unites
  FOR EACH ROW EXECUTE FUNCTION prevent_unite_delete();
DROP TRIGGER IF EXISTS trg_set_updated_at_taches ON taches;
CREATE TRIGGER trg_set_updated_at_taches
  BEFORE UPDATE ON taches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_requisition_lignes_stock ON requisition_lignes;
CREATE TRIGGER trg_requisition_lignes_stock
  BEFORE INSERT ON requisition_lignes
  FOR EACH ROW EXECUTE FUNCTION set_requisition_stock_theorique();
DROP TRIGGER IF EXISTS trg_transfert_lignes_stock ON transfert_lignes;
CREATE TRIGGER trg_transfert_lignes_stock
  AFTER INSERT ON transfert_lignes
  FOR EACH ROW EXECUTE FUNCTION insert_stock_from_transfert_ligne();
DROP TRIGGER IF EXISTS trg_set_updated_at_ventes_fiches_carte ON ventes_fiches_carte;
CREATE TRIGGER trg_set_updated_at_ventes_fiches_carte
  BEFORE UPDATE ON ventes_fiches_carte
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
