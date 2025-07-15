-- Fonctions manquantes creees pour correspondance avec le front-end

-- Fonction dashboard_stats
CREATE FUNCTION dashboard_stats(mama_id_param uuid, page_param integer, page_size_param integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Fonction consolidated_stats
CREATE FUNCTION consolidated_stats()
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

CREATE FUNCTION advanced_stats(start_date date, end_date date)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;


-- Fonction fn_calc_budgets
CREATE FUNCTION fn_calc_budgets(mama_id_param uuid, periode_param text)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Fonction send_email_notification
CREATE FUNCTION send_email_notification(template text, params jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
END;
$$;

-- Fonction send_notification_webhook
CREATE FUNCTION send_notification_webhook(payload jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
END;
$$;

-- Fonction stats_cost_centers
CREATE FUNCTION stats_cost_centers(mama_id_param uuid, debut_param date, fin_param date)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Fonction apply_stock_from_achat
CREATE FUNCTION apply_stock_from_achat(achat_id uuid, achat_table text, mama_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
END;
$$;

-- Fonction import_invoice(payload jsonb)
CREATE FUNCTION import_invoice(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Fonction suggest_cost_centers
CREATE FUNCTION suggest_cost_centers(p_produit_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;
-- Fonction top_produits
CREATE FUNCTION top_produits(mama_id_param uuid, debut_param date, fin_param date, limit_param integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Fonction compare_fiche
CREATE FUNCTION compare_fiche(fiche_id uuid, mama_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Fonction stats_multi_mamas(mama_ids uuid[])
CREATE FUNCTION stats_multi_mamas(mama_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Fonction calcul_ecarts_inventaire(p_inventaire uuid)
CREATE FUNCTION calcul_ecarts_inventaire(p_date date, p_zone uuid, mama_id_param uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Fonction enable_two_fa
CREATE FUNCTION enable_two_fa(code text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
END;
$$;

-- Fonction disable_two_fa
CREATE FUNCTION disable_two_fa()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
END;
$$;


-- Tables manquantes utilisees par le front-end
CREATE TABLE IF NOT EXISTS regles_alertes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  produit_id uuid REFERENCES produits(id),
  type text,
  seuil numeric,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_double_facteur (
  id uuid PRIMARY KEY,
  secret text,
  enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  titre text,
  texte text,
  lien text,
  type text,
  lu boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bons_livraison (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  fournisseur_id uuid REFERENCES fournisseurs(id),
  numero_bl text,
  date_livraison date,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventaire_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  nom text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  module text,
  timestamp timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logs_securite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  type text,
  ip text,
  navigateur text,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Vues manquantes
CREATE OR REPLACE VIEW v_analytique_stock AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS produit_id,
  NULL::text AS famille,
  NULL::text AS activite,
  NULL::uuid AS cost_center_id,
  NULL::text AS cost_center_nom,
  NULL::numeric AS quantite,
  NULL::numeric AS valeur,
  NULL::date AS date;

CREATE OR REPLACE VIEW v_besoins_previsionnels AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS menu_id,
  NULL::uuid AS produit_id,
  NULL::numeric AS quantite;

CREATE OR REPLACE VIEW v_cost_center_month AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS cost_center_id,
  NULL::text AS nom,
  NULL::text AS mois,
  NULL::numeric AS total;

CREATE OR REPLACE VIEW v_ecarts_inventaire AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS produit_id,
  NULL::date AS date,
  NULL::uuid AS zone,
  NULL::numeric AS stock_theorique,
  NULL::numeric AS stock_reel,
  NULL::numeric AS ecart,
  NULL::text AS motif;

-- Fonctions additionnelles necessaires
CREATE FUNCTION stats_achats_fournisseurs(mama_id_param uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

CREATE FUNCTION stats_achats_fournisseur(mama_id_param uuid, fournisseur_id_param uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

CREATE FUNCTION stats_rotation_produit(mama_id_param uuid, produit_id_param uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- Ajout colonnes manquantes pour stock_mouvements
ALTER TABLE stock_mouvements
  ADD COLUMN IF NOT EXISTS date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS quantite numeric,
  ADD COLUMN IF NOT EXISTS produit_id uuid REFERENCES produits(id),
  ADD COLUMN IF NOT EXISTS zone_source_id uuid REFERENCES zones_stock(id),
  ADD COLUMN IF NOT EXISTS zone_destination_id uuid REFERENCES zones_stock(id),
  ADD COLUMN IF NOT EXISTS commentaire text,
  ADD COLUMN IF NOT EXISTS auteur_id uuid REFERENCES utilisateurs(id);

CREATE INDEX IF NOT EXISTS idx_stock_mouvements_date ON stock_mouvements(date);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_produit ON stock_mouvements(produit_id);

-- Tables supplementaires pour modules front-end
CREATE TABLE IF NOT EXISTS catalogue_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  fournisseur_id uuid REFERENCES fournisseurs(id),
  produit_id uuid REFERENCES produits(id),
  ancienne_valeur numeric,
  nouvelle_valeur numeric,
  modification jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  fournisseur_id uuid REFERENCES fournisseurs(id),
  statut text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  chemin text,
  type text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS etapes_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  etape text,
  terminee boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fournisseurs_api_config (
  fournisseur_id uuid REFERENCES fournisseurs(id) ON DELETE CASCADE,
  mama_id uuid REFERENCES mamas(id) NOT NULL,
  url text,
  type_api text DEFAULT 'rest',
  token text,
  format_facture text DEFAULT 'json',
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (fournisseur_id, mama_id)
);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_api_config_fournisseur_id
  ON fournisseurs_api_config(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_api_config_mama_id
  ON fournisseurs_api_config(mama_id);

CREATE TABLE IF NOT EXISTS tableaux_de_bord (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  nom text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gadgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tableau_id uuid REFERENCES tableaux_de_bord(id),
  type text,
  config jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text,
  contenu text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lignes_bl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bl_id uuid REFERENCES bons_livraison(id),
  produit_id uuid REFERENCES produits(id),
  quantite numeric,
  prix numeric,
  tva numeric,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planning_previsionnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  date_prevue date,
  quantite numeric,
  produit_id uuid REFERENCES produits(id),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  created_by uuid REFERENCES utilisateurs(id),
  type text,
  description text,
  date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tableaux_de_bord (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  nom text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS validation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  module text,
  payload jsonb,
  statut text,
  created_at timestamp with time zone DEFAULT now()
);

-- Colonnes manquantes pour factures
ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS total_ht numeric,
  ADD COLUMN IF NOT EXISTS total_tva numeric,
  ADD COLUMN IF NOT EXISTS total_ttc numeric,
  ADD COLUMN IF NOT EXISTS statut text;

ALTER TABLE factures
  ADD CONSTRAINT uniq_factures_numero UNIQUE (mama_id, fournisseur_id, numero, date_facture);

-- Colonnes supplémentaires utilisées côté front sur la table produits
ALTER TABLE produits
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS allergenes text,
  ADD COLUMN IF NOT EXISTS pmp numeric,
  ADD COLUMN IF NOT EXISTS stock_reel numeric,
  ADD COLUMN IF NOT EXISTS stock_min numeric,
  ADD COLUMN IF NOT EXISTS stock_theorique numeric,
  ADD COLUMN IF NOT EXISTS main_supplier_id uuid REFERENCES fournisseurs(id);

CREATE INDEX IF NOT EXISTS idx_produits_main_supplier ON produits(main_supplier_id);

-- Tables additionnelles requises par le front-end
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  name text,
  scopes jsonb,
  role text,
  expiration date,
  revoked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compta_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  cle text,
  compte text,
  type text,
  created_at timestamp with time zone DEFAULT now()
);

-- Vues supplémentaires utilisées par les hooks React
CREATE OR REPLACE VIEW v_reco_stockmort AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS produit_id,
  NULL::text AS nom,
  NULL::integer AS jours_inactif;

-- Vue de recommandation surcoût
CREATE OR REPLACE VIEW v_reco_surcout AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS produit_id,
  NULL::text AS nom,
  NULL::numeric AS variation_pct;

CREATE OR REPLACE VIEW v_cost_center_monthly AS
SELECT
  NULL::uuid AS mama_id,
  NULL::text AS nom,
  NULL::text AS mois,
  NULL::numeric AS montant;

CREATE OR REPLACE VIEW v_fournisseurs_inactifs AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS fournisseur_id,
  NULL::text AS nom,
  NULL::date AS dernier_achat;

CREATE OR REPLACE VIEW v_monthly_purchases AS
SELECT
  NULL::uuid AS mama_id,
  NULL::text AS mois,
  NULL::numeric AS total;

CREATE OR REPLACE VIEW v_pmp AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS produit_id,
  NULL::text AS mois,
  NULL::numeric AS pmp;
-- Vue pour derniers prix produits utilisée dans plusieurs hooks

-- Correction de la vue v_produits_dernier_prix pour éviter l'erreur "date_livraison does not exist"

DROP VIEW IF EXISTS v_produits_dernier_prix;

-- Sécurité : s'assurer que date_livraison et prix_achat existent dans fournisseur_produits
ALTER TABLE fournisseur_produits
  ADD COLUMN IF NOT EXISTS prix_achat numeric,
  ADD COLUMN IF NOT EXISTS date_livraison date;


CREATE OR REPLACE VIEW v_produits_dernier_prix AS
SELECT p.id, p.mama_id, p.nom, f.nom AS famille, u.nom AS unite,
       p.pmp, p.stock_reel, p.stock_min, p.stock_theorique,
       fp.prix_achat AS dernier_prix, fp.date_livraison AS date_dernier_modification
FROM produits p
LEFT JOIN familles f ON f.id = p.famille_id
LEFT JOIN unites u ON u.id = p.unite_id
LEFT JOIN (
  SELECT produit_id, date_livraison, prix_achat
  FROM (
    SELECT produit_id, date_livraison, prix_achat,
           ROW_NUMBER() OVER (PARTITION BY produit_id ORDER BY date_livraison DESC) AS rn
    FROM fournisseur_produits
  ) sub
  WHERE rn = 1
) fp ON fp.produit_id = p.id;



CREATE OR REPLACE VIEW v_tendance_prix_produit AS
SELECT
  NULL::uuid AS mama_id,
  NULL::uuid AS produit_id,
  NULL::text AS mois,
  NULL::numeric AS prix_moyen;

-- Colonnes supplémentaires pour la table inventaires
ALTER TABLE inventaires
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS zone text,
  ADD COLUMN IF NOT EXISTS date_debut date,
  ADD COLUMN IF NOT EXISTS cloture boolean DEFAULT false;

-- Table feedback utilisée par le formulaire d'assistance
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  module text,
  message text,
  urgence text,
  created_at timestamp with time zone DEFAULT now()
);

-- Colonnes supplémentaires pour l'historique des prix fournisseurs

-- Création minimale de la table fournisseur_produits si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS fournisseur_produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid REFERENCES produits(id),
  fournisseur_id uuid REFERENCES fournisseurs(id),
  prix numeric,
  date_livraison date,
  created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE fournisseur_produits
  ADD COLUMN IF NOT EXISTS prix_achat numeric,
  ADD COLUMN IF NOT EXISTS date_livraison date;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_fournisseur_produits
  ON fournisseur_produits(produit_id, fournisseur_id, date_livraison);
CREATE INDEX IF NOT EXISTS idx_fp_produit ON fournisseur_produits(produit_id);
CREATE INDEX IF NOT EXISTS idx_fp_fournisseur ON fournisseur_produits(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_fp_date ON fournisseur_produits(date_livraison);

-- Tables d'aide contextuelle
CREATE TABLE IF NOT EXISTS tooltips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  champ text,
  texte text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  titre text,
  contenu text,
  categorie text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guides_seen (
  user_id uuid REFERENCES utilisateurs(id),
  mama_id uuid REFERENCES mamas(id),
  module text,
  seen boolean DEFAULT false,
  PRIMARY KEY (user_id, module)
);

-- Consentements RGPD des utilisateurs
CREATE TABLE IF NOT EXISTS consentements_utilisateur (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES utilisateurs(id),
  mama_id uuid REFERENCES mamas(id),
  consentement boolean,
  date_consentement timestamp with time zone,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consentements_utilisateur_user
  ON consentements_utilisateur(user_id);
CREATE INDEX IF NOT EXISTS idx_consentements_utilisateur_mama
  ON consentements_utilisateur(mama_id);