-- ===========================
-- 0. Ajout/correction systématique des colonnes critiques AVANT vues et contraintes

ALTER TABLE IF EXISTS produits ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS fournisseurs ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS fournisseur_produits ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS factures ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS facture_lignes ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS fiches_techniques ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS inventaires ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS inventaire_lignes ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS ventes_fiches_carte ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS achats ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS mouvements_stock ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS mouvements_centres_cout ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS centres_de_cout ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS utilisateurs ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS journaux_utilisateur ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS logs_securite ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS gadgets ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS tableaux_de_bord ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS promotions ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS promotion_produits ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS journal_audit ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS notification_preferences ADD COLUMN IF NOT EXISTS mama_id uuid;
ALTER TABLE IF EXISTS consentements_utilisateur ADD COLUMN IF NOT EXISTS mama_id uuid;

-- Ajout automatique des colonnes "actif"
ALTER TABLE IF EXISTS produits ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS fournisseurs ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS fournisseur_produits ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS factures ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS facture_lignes ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS fiches_techniques ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS inventaires ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS inventaire_lignes ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS ventes_fiches_carte ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS achats ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS mouvements_stock ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS mouvements_centres_cout ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS centres_de_cout ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS gadgets ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS promotions ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;
ALTER TABLE IF EXISTS promotion_produits ADD COLUMN IF NOT EXISTS actif boolean DEFAULT TRUE;

-- Correction systématique utilisateur_id (si pas déjà présent)
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS utilisateur_id uuid REFERENCES utilisateurs(id);
ALTER TABLE IF EXISTS journaux_utilisateur ADD COLUMN IF NOT EXISTS utilisateur_id uuid REFERENCES utilisateurs(id);
ALTER TABLE IF EXISTS logs_securite ADD COLUMN IF NOT EXISTS utilisateur_id uuid REFERENCES utilisateurs(id);
ALTER TABLE IF EXISTS tableaux_de_bord ADD COLUMN IF NOT EXISTS utilisateur_id uuid REFERENCES utilisateurs(id);
ALTER TABLE IF EXISTS consentements_utilisateur ADD COLUMN IF NOT EXISTS utilisateur_id uuid REFERENCES utilisateurs(id);
ALTER TABLE IF EXISTS notification_preferences ADD COLUMN IF NOT EXISTS utilisateur_id uuid REFERENCES utilisateurs(id);
ALTER TABLE IF EXISTS journal_audit ADD COLUMN IF NOT EXISTS utilisateur_id uuid REFERENCES utilisateurs(id);

-- Ajout/alignement des colonnes spécifiques restantes
ALTER TABLE IF EXISTS fiches_techniques
  ADD COLUMN IF NOT EXISTS nom text,
  ADD COLUMN IF NOT EXISTS cout_par_portion numeric,
  ADD COLUMN IF NOT EXISTS portions numeric DEFAULT 1;

ALTER TABLE IF EXISTS inventaire_lignes
  ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES zones_stock(id),
  ADD COLUMN IF NOT EXISTS quantite_theorique numeric,
  ADD COLUMN IF NOT EXISTS quantite_reelle numeric,
  ADD COLUMN IF NOT EXISTS motif text;

ALTER TABLE IF EXISTS consentements_utilisateur ADD COLUMN IF NOT EXISTS type_consentement text;

ALTER TABLE IF EXISTS journaux_utilisateur
  ADD COLUMN IF NOT EXISTS page text,
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS date_action timestamptz;

ALTER TABLE IF EXISTS logs_securite
  ADD COLUMN IF NOT EXISTS type_evenement text,
  ADD COLUMN IF NOT EXISTS details jsonb,
  ADD COLUMN IF NOT EXISTS date_evenement timestamptz,
  ADD COLUMN IF NOT EXISTS niveau_criticite text;

-- ===========================
-- 1. Sécurité/RLS pour les tables sensibles

ALTER TABLE IF EXISTS utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS utilisateurs FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON TABLE utilisateurs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE roles TO authenticated;

ALTER TABLE IF EXISTS validation_requests
  ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_validation_requests_actif ON validation_requests(actif);
CREATE INDEX IF NOT EXISTS idx_validation_requests_updated ON validation_requests(updated_at);
ALTER TABLE IF EXISTS validation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS validation_requests FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS validation_requests_all ON validation_requests;
CREATE POLICY validation_requests_all ON validation_requests
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

ALTER TABLE IF EXISTS fournisseurs_api_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fournisseurs_api_config FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fournisseurs_api_config_all ON fournisseurs_api_config;
CREATE POLICY fournisseurs_api_config_all ON fournisseurs_api_config
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

ALTER TABLE IF EXISTS produits ADD COLUMN IF NOT EXISTS dernier_prix numeric;
ALTER TABLE IF EXISTS produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS produits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS produits_all ON produits;
CREATE POLICY produits_all ON produits
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

ALTER TABLE IF EXISTS fournisseur_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fournisseur_produits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fournisseur_produits_all ON fournisseur_produits;
CREATE POLICY fournisseur_produits_all ON fournisseur_produits
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

ALTER TABLE IF EXISTS factures ADD COLUMN IF NOT EXISTS montant_total numeric;
UPDATE factures SET montant_total = coalesce(total_ttc, 0) WHERE montant_total IS NULL;

ALTER TABLE IF EXISTS facture_lignes
  ADD COLUMN IF NOT EXISTS prix_unitaire numeric,
  ADD COLUMN IF NOT EXISTS tva numeric,
  ADD COLUMN IF NOT EXISTS total numeric;
UPDATE facture_lignes
  SET prix_unitaire = coalesce(prix, 0),
      total = coalesce(quantite * coalesce(prix,0), 0)
  WHERE prix_unitaire IS NULL;

ALTER TABLE IF EXISTS factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS factures FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS factures_all ON factures;
CREATE POLICY factures_all ON factures
  FOR ALL USING (mama_id = (SELECT mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  WITH CHECK (mama_id = (SELECT mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

ALTER TABLE IF EXISTS facture_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS facture_lignes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS facture_lignes_all ON facture_lignes;
CREATE POLICY facture_lignes_all ON facture_lignes
  FOR ALL USING (mama_id = (SELECT mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  WITH CHECK (mama_id = (SELECT mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

-- ===========================
-- 2. Tables métiers principales

CREATE TABLE IF NOT EXISTS achats (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid references mamas(id),
  produit_id uuid references produits(id),
  supplier_id uuid references fournisseurs(id),
  prix numeric,
  quantite numeric,
  date_achat date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  actif boolean default true
);
CREATE INDEX IF NOT EXISTS idx_achats_mama_id ON achats(mama_id);
CREATE INDEX IF NOT EXISTS idx_achats_date ON achats(date_achat);
ALTER TABLE IF EXISTS achats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achats FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS achats_all ON achats;
CREATE POLICY achats_all ON achats
  FOR ALL USING (mama_id = (SELECT mama_id FROM utilisateurs WHERE auth_id = auth.uid()))
  WITH CHECK (mama_id = (SELECT mama_id FROM utilisateurs WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS promotions (
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
CREATE INDEX IF NOT EXISTS idx_promotions_mama_id ON promotions(mama_id);
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON promotions(created_at);
ALTER TABLE IF EXISTS promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS promotions_all ON promotions;
CREATE POLICY promotions_all ON promotions
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

CREATE TABLE IF NOT EXISTS promotion_produits (
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
CREATE INDEX IF NOT EXISTS idx_promotion_produits_mama_id ON promotion_produits(mama_id);
ALTER TABLE IF EXISTS promotion_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotion_produits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS promotion_produits_all ON promotion_produits;
CREATE POLICY promotion_produits_all ON promotion_produits
  FOR ALL USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

CREATE TABLE IF NOT EXISTS journal_audit (
  id uuid primary key default gen_random_uuid(),
  table_modifiee text,
  operation text,
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id),
  date_action timestamptz default now(),
  donnees_avant jsonb,
  donnees_apres jsonb
);
CREATE INDEX IF NOT EXISTS idx_journal_audit_mama ON journal_audit(mama_id);

CREATE OR REPLACE FUNCTION insert_journal_audit() RETURNS trigger AS $$
BEGIN
  INSERT INTO journal_audit(
    table_modifiee,
    operation,
    utilisateur_id,
    mama_id,
    date_action,
    donnees_avant,
    donnees_apres
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    coalesce(new.mama_id, old.mama_id),
    now(),
    row_to_json(old),
    row_to_json(new)
  );
  IF TG_OP = 'DELETE' THEN
    RETURN old;
  ELSE
    RETURN new;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_produits
  AFTER INSERT OR UPDATE OR DELETE ON produits
  FOR EACH ROW EXECUTE PROCEDURE insert_journal_audit();

CREATE TRIGGER trg_audit_factures
  AFTER INSERT OR UPDATE OR DELETE ON factures
  FOR EACH ROW EXECUTE PROCEDURE insert_journal_audit();

-- ===========================
-- 3. RGPD, notifications, gadgets, logs

CREATE TABLE IF NOT EXISTS consentements_utilisateur (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id),
  type_consentement text,
  donne boolean,
  date_consentement timestamptz default now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id),
  titre text,
  message text,
  lu boolean default false,
  date_envoi timestamptz default now(),
  actif boolean default true
);
CREATE INDEX IF NOT EXISTS idx_notifications_mama_id ON notifications(mama_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(utilisateur_id);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id),
  email_enabled boolean default true,
  webhook_enabled boolean default false,
  webhook_url text,
  webhook_token text,
  updated_at timestamptz default now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_notif_prefs_user ON notification_preferences(utilisateur_id, mama_id);

CREATE TABLE IF NOT EXISTS gadgets (
  id uuid primary key default gen_random_uuid(),
  type text,
  nom text,
  configuration_json jsonb,
  mama_id uuid references mamas(id),
  actif boolean default true,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_gadgets_mama_id ON gadgets(mama_id);
CREATE INDEX IF NOT EXISTS idx_gadgets_actif ON gadgets(actif);

CREATE TABLE IF NOT EXISTS tableaux_de_bord (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  liste_gadgets_json jsonb,
  mama_id uuid references mamas(id),
  created_at timestamptz default now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tableaux_de_bord_user ON tableaux_de_bord(utilisateur_id, mama_id);
CREATE INDEX IF NOT EXISTS idx_tableaux_de_bord_mama_id ON tableaux_de_bord(mama_id);

CREATE TABLE IF NOT EXISTS journaux_utilisateur (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id),
  action text,
  page text,
  ip text,
  date_action timestamptz default now(),
  mama_id uuid references mamas(id)
);
CREATE INDEX IF NOT EXISTS idx_journaux_utilisateur_mama ON journaux_utilisateur(mama_id);

CREATE TABLE IF NOT EXISTS logs_securite (
  id uuid primary key default gen_random_uuid(),
  type_evenement text,
  details jsonb,
  date_evenement timestamptz default now(),
  niveau_criticite text,
  utilisateur_id uuid references utilisateurs(id),
  mama_id uuid references mamas(id)
);
CREATE INDEX IF NOT EXISTS idx_logs_securite_mama ON logs_securite(mama_id);

-- ===========================
-- 4. Vues analytiques et métiers

DROP VIEW IF EXISTS v_notifications_non_lues CASCADE;
DROP VIEW IF EXISTS v_produits_dernier_prix CASCADE;
DROP VIEW IF EXISTS v_produits_inactifs CASCADE;
DROP VIEW IF EXISTS v_produits_actifs CASCADE;
DROP VIEW IF EXISTS v_cost_center_monthly CASCADE;
DROP VIEW IF EXISTS v_tendance_prix_produit CASCADE;
DROP VIEW IF EXISTS v_reco_surcout CASCADE;
DROP VIEW IF EXISTS v_reco_stockmort CASCADE;
DROP VIEW IF EXISTS v_evolution_achats CASCADE;
DROP VIEW IF EXISTS v_ecarts_inventaire CASCADE;
DROP VIEW IF EXISTS v_pmp CASCADE;
DROP VIEW IF EXISTS v_monthly_purchases CASCADE;
DROP VIEW IF EXISTS v_performance_fiches CASCADE;


DROP VIEW IF EXISTS v_performance_fiches;
CREATE OR REPLACE VIEW v_performance_fiches AS
WITH ventes AS (
  SELECT mama_id, fiche_id, SUM(ventes) AS volume
  FROM ventes_fiches_carte
  WHERE actif = true
  GROUP BY mama_id, fiche_id
), totals AS (
  SELECT mama_id, SUM(ventes) AS total_volume
  FROM ventes_fiches_carte
  WHERE actif = true
  GROUP BY mama_id
)
SELECT
  f.mama_id,
  f.id AS fiche_id,
  f.nom,
  COALESCE(f.cout_par_portion, NULL) AS cout,
  COALESCE(v.volume, 0) AS volume,
  CASE WHEN t.total_volume > 0 THEN COALESCE(v.volume,0)::numeric / t.total_volume ELSE 0 END AS popularite
FROM fiches_techniques f
LEFT JOIN ventes v ON v.fiche_id = f.id AND v.mama_id = f.mama_id
LEFT JOIN totals t ON t.mama_id = f.mama_id
WHERE f.actif = true;


CREATE OR REPLACE VIEW v_monthly_purchases AS
SELECT f.mama_id,
       to_char(date_trunc('month', f.date_facture), 'YYYY-MM') AS mois,
       sum(fl.prix_unitaire * fl.quantite) AS total
FROM factures f
JOIN facture_lignes fl ON fl.facture_id = f.id
WHERE f.actif = true
  AND fl.actif = true
GROUP BY f.mama_id, to_char(date_trunc('month', f.date_facture), 'YYYY-MM');

CREATE OR REPLACE VIEW v_pmp AS
SELECT p.mama_id,
       p.id AS produit_id,
       p.actif AS produit_actif,
       bool_or(fp.actif) AS fournisseur_produit_actif,
       coalesce(avg(fp.prix_achat), 0) AS pmp
FROM produits p
LEFT JOIN fournisseur_produits fp ON fp.produit_id = p.id AND fp.mama_id = p.mama_id
GROUP BY p.mama_id, p.id, p.actif;

CREATE OR REPLACE VIEW v_ecarts_inventaire AS
SELECT i.mama_id,
       l.produit_id,
       i.date_inventaire AS date,
       l.zone_id AS zone,
       l.quantite_theorique AS stock_theorique,
       l.quantite_reelle AS stock_reel,
       l.quantite_reelle - l.quantite_theorique AS ecart,
       l.motif
FROM inventaires i
JOIN inventaire_lignes l ON l.inventaire_id = i.id
WHERE i.actif = true
  AND l.actif = true;

CREATE OR REPLACE VIEW v_evolution_achats AS
SELECT f.mama_id,
       fl.produit_id,
       to_char(date_trunc('month', f.date_facture), 'YYYY-MM') AS mois,
       sum(fl.prix_unitaire * fl.quantite) AS montant
FROM facture_lignes fl
JOIN factures f ON f.id = fl.facture_id
WHERE f.actif = true
  AND fl.actif = true
GROUP BY f.mama_id, fl.produit_id, to_char(date_trunc('month', f.date_facture), 'YYYY-MM');

DROP VIEW IF EXISTS v_reco_stockmort;
CREATE OR REPLACE VIEW v_reco_stockmort AS
SELECT p.mama_id,
       p.id AS produit_id,
       p.nom,
       coalesce(date_part('day', now() - max(sm.date)), 9999) AS jours_inactif
FROM produits p
LEFT JOIN stock_mouvements sm ON sm.produit_id = p.id
  AND sm.mama_id = p.mama_id AND sm.actif IS TRUE
WHERE p.mama_id = current_user_mama_id()
GROUP BY p.mama_id, p.id, p.nom;

CREATE OR REPLACE VIEW v_reco_surcout AS
WITH prix AS (
    SELECT fp.mama_id,
           fp.produit_id,
           fp.prix_achat,
           row_number() OVER (PARTITION BY fp.produit_id ORDER BY fp.date_livraison DESC) rn
    FROM fournisseur_produits fp
    WHERE fp.actif IS TRUE
      AND fp.mama_id = current_user_mama_id()
)
SELECT p.mama_id,
       p.id AS produit_id,
       p.nom,
       CASE WHEN prev.prix_achat IS NULL THEN NULL
            ELSE round(100 * (last.prix_achat - prev.prix_achat) / prev.prix_achat, 2)
       END AS variation_pct
FROM produits p
JOIN prix last ON last.produit_id = p.id AND last.rn = 1
LEFT JOIN prix prev ON prev.produit_id = p.id AND prev.rn = 2
WHERE p.mama_id = current_user_mama_id();

CREATE OR REPLACE VIEW v_tendance_prix_produit AS
SELECT f.mama_id,
       fl.produit_id,
       to_char(date_trunc('month', f.date_facture),'YYYY-MM') AS mois,
       avg(fl.prix_unitaire) AS prix_moyen
FROM factures f
JOIN facture_lignes fl ON fl.facture_id = f.id
WHERE f.actif = true
  AND fl.actif = true
  AND f.mama_id = current_user_mama_id()
GROUP BY f.mama_id, fl.produit_id, to_char(date_trunc('month', f.date_facture),'YYYY-MM');

CREATE OR REPLACE VIEW v_cost_center_monthly AS
SELECT mc.mama_id,
       cc.nom,
       to_char(date_trunc('month', mc.created_at),'YYYY-MM') AS mois,
       sum(coalesce(mc.valeur,0)) AS montant
FROM mouvements_centres_cout mc
JOIN centres_de_cout cc ON cc.id = mc.centre_cout_id
WHERE mc.actif = true
  AND cc.actif = true
  AND mc.mama_id = current_user_mama_id()
GROUP BY mc.mama_id, cc.nom, to_char(date_trunc('month', mc.created_at),'YYYY-MM');

-- Vue produits actifs/inactifs (utilitaires)
CREATE OR REPLACE VIEW v_produits_actifs AS
SELECT * FROM produits WHERE actif = true;

CREATE OR REPLACE VIEW v_produits_inactifs AS
SELECT * FROM produits WHERE actif = false;

-- Vue derniers prix produits/fournisseurs
CREATE OR REPLACE VIEW v_produits_dernier_prix AS
SELECT
  p.id as produit_id,
  p.nom as produit,
  fp.fournisseur_id,
  f.nom as fournisseur,
  fp.prix_achat as dernier_prix,
  fp.date_livraison
FROM produits p
JOIN fournisseur_produits fp ON fp.produit_id = p.id
JOIN fournisseurs f ON f.id = fp.fournisseur_id
WHERE fp.date_livraison = (
  SELECT max(fp2.date_livraison)
  FROM fournisseur_produits fp2
  WHERE fp2.produit_id = p.id
    AND fp2.fournisseur_id = fp.fournisseur_id
    AND fp2.actif = true
);

-- Vue notifications non lues par utilisateur (correction ici : colonne utilisateur_id toujours présente)
CREATE OR REPLACE VIEW v_notifications_non_lues AS
SELECT
  utilisateur_id,
  mama_id,
  count(*) as total_non_lues
FROM notifications
WHERE lu = false
GROUP BY utilisateur_id, mama_id;
