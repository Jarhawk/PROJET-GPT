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

-- Table des périodes comptables
CREATE TABLE IF NOT EXISTS periodes_comptables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid NOT NULL REFERENCES mamas(id) ON DELETE CASCADE,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  cloturee boolean DEFAULT false,
  actuelle boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_periodes_comptables_mama ON periodes_comptables(mama_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_periodes_actuelle ON periodes_comptables(mama_id) WHERE actuelle;

ALTER TABLE periodes_comptables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS periodes_comptables_all ON periodes_comptables;
CREATE POLICY periodes_comptables_all ON periodes_comptables
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

CREATE OR REPLACE FUNCTION periode_actuelle(mid uuid)
RETURNS TABLE(
  id uuid,
  mama_id uuid,
  date_debut date,
  date_fin date,
  cloturee boolean,
  actuelle boolean
) AS $$
  SELECT * FROM periodes_comptables
  WHERE mama_id = mid AND actuelle = true
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Module Tâches

-- Table des tâches
CREATE TABLE IF NOT EXISTS taches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid NOT NULL REFERENCES mamas(id) ON DELETE CASCADE,
  titre text NOT NULL,
  description text,
  priorite text CHECK (priorite IN ('basse','moyenne','haute')) DEFAULT 'moyenne',
  statut text CHECK (statut IN ('a_faire','en_cours','terminee')) DEFAULT 'a_faire',
  date_echeance date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_taches_mama_id ON taches(mama_id);
CREATE INDEX IF NOT EXISTS idx_taches_statut ON taches(statut);
CREATE INDEX IF NOT EXISTS idx_taches_priorite ON taches(priorite);

DROP TRIGGER IF EXISTS trg_set_updated_at_taches ON taches;
CREATE TRIGGER trg_set_updated_at_taches
  BEFORE UPDATE ON taches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS taches_all ON taches;
CREATE POLICY taches_all ON taches
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

-- Table de liaison tâches/utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs_taches (
  tache_id uuid REFERENCES taches(id) ON DELETE CASCADE,
  utilisateur_id uuid REFERENCES utilisateurs(id) ON DELETE CASCADE,
  PRIMARY KEY (tache_id, utilisateur_id)
);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_taches_utilisateur ON utilisateurs_taches(utilisateur_id);

ALTER TABLE utilisateurs_taches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS utilisateurs_taches_all ON utilisateurs_taches;
CREATE POLICY utilisateurs_taches_all ON utilisateurs_taches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM taches t WHERE t.id = tache_id AND t.mama_id = current_user_mama_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM taches t WHERE t.id = tache_id AND t.mama_id = current_user_mama_id()
    )
  );

-- Vue facilitant les jointures avec les utilisateurs
CREATE OR REPLACE VIEW v_taches_assignees AS
SELECT
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
  u.nom AS utilisateur_nom
FROM taches t
LEFT JOIN utilisateurs_taches ut ON ut.tache_id = t.id
LEFT JOIN utilisateurs u ON u.id = ut.utilisateur_id;
