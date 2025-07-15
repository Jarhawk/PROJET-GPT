-- Fonctions manquantes creees pour correspondance avec le front-end

-- Permet la creation des fonctions meme si les tables references ne sont pas encore presentes
-- lors de l'import sur Supabase. Ce parametre sera remis a 'on' a la fin du fichier
SET check_function_bodies = off;

-- Extension nécessaire pour gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fonction dashboard_stats
CREATE OR REPLACE FUNCTION dashboard_stats(mama_id_param uuid, page_param integer, page_size_param integer)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_stock numeric;
  v_conso numeric;
  v_mouvements integer;
BEGIN
  SELECT COALESCE(sum(p.pmp * p.stock_reel),0)
    INTO v_stock
    FROM produits p
   WHERE p.mama_id = mama_id_param;

  SELECT COALESCE(sum(abs(ms.quantite)),0)
    INTO v_conso
    FROM stock_mouvements ms
   WHERE ms.mama_id = mama_id_param
     AND ms.type = 'sortie'
     AND date_trunc('month', ms.date) = date_trunc('month', current_date);

  SELECT count(*)
    INTO v_mouvements
    FROM stock_mouvements ms
   WHERE ms.mama_id = mama_id_param;

  RETURN jsonb_build_object(
    'stock_valorise', v_stock,
    'conso_mois', v_conso,
    'nb_mouvements', v_mouvements
  );
END;
$$;

-- Fonction consolidated_stats
CREATE OR REPLACE FUNCTION consolidated_stats()
RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_agg(row_to_json(t))
    FROM (
      SELECT m.id AS mama_id,
             m.nom,
             COALESCE(sum(p.stock_reel * p.pmp),0) AS stock_valorise,
             (
               SELECT sum(abs(ms.quantite))
    FROM stock_mouvements ms
                WHERE ms.mama_id = m.id
                  AND ms.type = 'sortie'
                  AND date_trunc('month', ms.date) = date_trunc('month', current_date)
             ) AS conso_mois,
             (
               SELECT count(*) FROM stock_mouvements ms WHERE ms.mama_id = m.id
             ) AS nb_mouvements
        FROM mamas m
        LEFT JOIN produits p ON p.mama_id = m.id
       GROUP BY m.id, m.nom
    ) t;
$$;

CREATE OR REPLACE FUNCTION advanced_stats(start_date date, end_date date)
RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object(
    'start', start_date,
    'end', end_date,
    'total_mouvements', (
      SELECT count(*) FROM stock_mouvements ms
       WHERE (start_date IS NULL OR ms.date >= start_date)
         AND (end_date IS NULL OR ms.date <= end_date)
    )
  );
$$;


-- Fonction fn_calc_budgets
CREATE OR REPLACE FUNCTION fn_calc_budgets(mama_id_param uuid, periode_param text)
RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_agg(row_to_json(t))
  FROM calculer_budgets(mama_id_param, periode_param) t;
$$;

-- Fonction send_email_notification
CREATE OR REPLACE FUNCTION send_email_notification(template text, params jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- L'envoi réel d'email est géré côté application ;
  -- on ignore simplement les paramètres pour ne pas générer d'erreur
  PERFORM template, params;
END;
$$;

-- Fonction send_notification_webhook
CREATE OR REPLACE FUNCTION send_notification_webhook(payload jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- En production le déclenchement du webhook est géré par l'application.
  -- Ici on ignore juste la charge utile pour fournir un point d'appel sans effet
  PERFORM payload;
END;
$$;

-- Fonction stats_cost_centers
CREATE OR REPLACE FUNCTION stats_cost_centers(mama_id_param uuid, debut_param date, fin_param date)
RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_agg(row_to_json(t))
  FROM (
    SELECT c.id AS centre_cout_id,
           c.nom,
           SUM(COALESCE(mc.quantite,0)) AS quantite,
           SUM(COALESCE(mc.valeur,0)) AS valeur
      FROM centres_de_cout c
      LEFT JOIN mouvements_centres_cout mc ON mc.centre_cout_id = c.id
       AND (debut_param IS NULL OR mc.created_at >= debut_param)
       AND (fin_param IS NULL OR mc.created_at < fin_param + interval '1 day')
     WHERE c.mama_id = mama_id_param
     GROUP BY c.id, c.nom
  ) t;
$$;

-- Fonction apply_stock_from_achat
CREATE OR REPLACE FUNCTION apply_stock_from_achat(achat_id uuid, achat_table text, mama_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Fonction appelée depuis l'application pour mettre à jour le stock
  -- Aucun traitement ici : on se contente d'ignorer les paramètres
  PERFORM achat_id, achat_table, mama_id;
END;
$$;

-- Fonction import_invoice(payload jsonb)
CREATE OR REPLACE FUNCTION import_invoice(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  fac_id uuid;
  supp_id uuid;
BEGIN
  SELECT id INTO supp_id
    FROM fournisseurs
   WHERE nom = payload->>'supplier_name'
     AND mama_id = current_user_mama_id()
   LIMIT 1;

  INSERT INTO factures(reference, date_facture, fournisseur_id, montant, statut, mama_id)
    VALUES (
      payload->>'reference',
      (payload->>'date')::date,
      supp_id,
      (payload->>'total')::numeric,
      'en attente',
      current_user_mama_id()
    )
    RETURNING id INTO fac_id;

  INSERT INTO facture_lignes(facture_id, produit_id, quantite, prix, mama_id)
  SELECT fac_id,
         p.id,
         (l->>'quantity')::numeric,
         (l->>'unit_price')::numeric,
         current_user_mama_id()
    FROM jsonb_array_elements(payload->'lines') AS l
    LEFT JOIN produits p
      ON p.code = l->>'product_code'
     AND p.mama_id = current_user_mama_id();

  RETURN fac_id;
END;
$$;

-- Fonction suggest_cost_centers
CREATE OR REPLACE FUNCTION suggest_cost_centers(p_produit_id uuid)
RETURNS TABLE(cost_center_id uuid, nom text, ratio numeric) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    mcc.centre_cout_id AS cost_center_id,
    cc.nom,
    SUM(ABS(mcc.quantite))::numeric / GREATEST(sum_mcc.quantite, 1) AS ratio
  FROM mouvements_centres_cout mcc
  JOIN stock_mouvements ms ON ms.id = mcc.mouvement_id
  JOIN centres_de_cout cc ON cc.id = mcc.centre_cout_id
  JOIN (
        SELECT SUM(ABS(m.quantite)) AS quantite
          FROM stock_mouvements m
         WHERE m.produit_id = p_produit_id
           AND m.mama_id = current_user_mama_id()
           AND m.quantite < 0
       ) sum_mcc ON TRUE
  WHERE ms.produit_id = p_produit_id
    AND ms.mama_id = current_user_mama_id()
    AND ms.quantite < 0
  GROUP BY mcc.centre_cout_id, cc.nom;
$$;
-- Fonction top_produits
CREATE OR REPLACE FUNCTION top_produits(mama_id_param uuid, debut_param date, fin_param date, limit_param integer)
RETURNS TABLE(produit_id uuid, nom text, quantite numeric) LANGUAGE sql AS $$
  SELECT p.id, p.nom, SUM(abs(ms.quantite)) AS quantite
    FROM produits p
  JOIN stock_mouvements ms ON ms.produit_id = p.id
   WHERE ms.mama_id = mama_id_param
     AND ms.type = 'sortie'
     AND (debut_param IS NULL OR ms.date >= debut_param)
     AND (fin_param IS NULL OR ms.date <= fin_param)
   GROUP BY p.id, p.nom
   ORDER BY quantite DESC
   LIMIT COALESCE(limit_param,5);
$$;

-- Fonction compare_fiche
CREATE OR REPLACE FUNCTION compare_fiche(fiche_id uuid, mama_ids uuid[])
RETURNS TABLE(mama_id uuid, nom text, cout numeric, rendement numeric) LANGUAGE sql AS $$
  SELECT m.id,
         m.nom,
         SUM(fl.quantite * COALESCE(p.pmp,0)) AS cout,
         SUM(fl.quantite) AS rendement
    FROM mamas m
    LEFT JOIN fiche_lignes fl ON fl.mama_id = m.id AND fl.fiche_id = fiche_id
    LEFT JOIN produits p ON p.id = fl.produit_id
   WHERE m.id = ANY(mama_ids)
   GROUP BY m.id, m.nom;
$$;

-- Fonction stats_multi_mamas(mama_ids uuid[])
CREATE OR REPLACE FUNCTION stats_multi_mamas(mama_ids uuid[])
RETURNS TABLE(
  mama_id uuid,
  nom text,
  cout_matiere numeric,
  nb_factures integer,
  taux_validation numeric,
  ecart_inventaire numeric
) LANGUAGE sql AS $$
  SELECT m.id,
         m.nom,
         COALESCE(SUM(p.stock_reel * p.pmp),0) AS cout_matiere,
         (SELECT COUNT(*) FROM factures f WHERE f.mama_id = m.id) AS nb_factures,
         (
           SELECT AVG(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END)
             FROM validation_requests vr
            WHERE vr.mama_id = m.id
         ) AS taux_validation,
         (
           SELECT SUM(ABS(il.quantite - COALESCE(pr.stock_theorique,0)))
             FROM inventaire_lignes il
             JOIN inventaires i ON i.id = il.inventaire_id
             JOIN produits pr ON pr.id = il.produit_id
            WHERE il.mama_id = m.id AND i.cloture = true
         ) AS ecart_inventaire
    FROM mamas m
    LEFT JOIN produits p ON p.mama_id = m.id
   WHERE m.id = ANY(mama_ids)
   GROUP BY m.id, m.nom;
$$;

-- Fonction calcul_ecarts_inventaire(p_inventaire uuid)
CREATE OR REPLACE FUNCTION calcul_ecarts_inventaire(p_date date, p_zone uuid, mama_id_param uuid)
RETURNS TABLE(
  produit text,
  stock_theorique numeric,
  stock_reel numeric,
  ecart numeric,
  motif text
) LANGUAGE sql AS $$
  SELECT pr.nom,
         pr.stock_theorique,
         il.quantite AS stock_reel,
         il.quantite - COALESCE(pr.stock_theorique,0) AS ecart,
         NULL::text AS motif
    FROM inventaire_lignes il
    JOIN inventaires i ON i.id = il.inventaire_id
    JOIN produits pr ON pr.id = il.produit_id
   WHERE il.mama_id = mama_id_param
     AND i.date_inventaire = p_date
     AND (p_zone IS NULL OR i.zone = p_zone);
$$;

-- Fonction enable_two_fa
CREATE OR REPLACE FUNCTION enable_two_fa(code text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users
     SET two_fa_enabled = true,
         two_fa_secret = code
   WHERE id = auth.uid();
END;
$$;

-- Fonction disable_two_fa
CREATE OR REPLACE FUNCTION disable_two_fa()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users
     SET two_fa_enabled = false,
         two_fa_secret = NULL
   WHERE id = auth.uid();
END;
$$;

-- Ajout de colonnes manquantes sur la table mamas
ALTER TABLE mamas
  ADD COLUMN IF NOT EXISTS nom text,
  ADD COLUMN IF NOT EXISTS ville text,
  ADD COLUMN IF NOT EXISTS contact text,
  ADD COLUMN IF NOT EXISTS logo text;

-- Colonnes supplémentaires pour centres_de_cout
ALTER TABLE centres_de_cout
  ADD COLUMN IF NOT EXISTS activite text,
  ADD COLUMN IF NOT EXISTS type text;


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
CREATE INDEX IF NOT EXISTS idx_regles_alertes_mama ON regles_alertes(mama_id);
CREATE INDEX IF NOT EXISTS idx_regles_alertes_produit ON regles_alertes(produit_id);

CREATE TABLE IF NOT EXISTS auth_double_facteur (
  id uuid PRIMARY KEY,
  secret text,
  enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_double_facteur_enabled ON auth_double_facteur(enabled);

-- Colonnes 2FA pour le schema d'authentification
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_fa_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_fa_secret text;

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
CREATE INDEX IF NOT EXISTS idx_notifications_mama ON notifications(mama_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS bons_livraison (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  fournisseur_id uuid REFERENCES fournisseurs(id),
  numero_bl text,
  date_livraison date,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_mama ON bons_livraison(mama_id);
CREATE INDEX IF NOT EXISTS idx_bons_livraison_fournisseur ON bons_livraison(fournisseur_id);

CREATE TABLE IF NOT EXISTS inventaire_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  nom text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventaire_zones_mama ON inventaire_zones(mama_id);

CREATE TABLE IF NOT EXISTS usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  module text,
  timestamp timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_stats_mama ON usage_stats(mama_id);

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
CREATE INDEX IF NOT EXISTS idx_logs_securite_mama ON logs_securite(mama_id);

-- Vues manquantes
DROP VIEW IF EXISTS v_analytique_stock;
CREATE VIEW v_analytique_stock AS
SELECT
  m.date AS date,
  m.produit_id,
  f.nom AS famille,
  c.activite,
  mc.centre_cout_id AS cost_center_id,
  c.nom AS cost_center_nom,
  m.quantite,
  mc.valeur,
  m.mama_id
FROM stock_mouvements m
LEFT JOIN mouvements_centres_cout mc ON mc.mouvement_id = m.id
LEFT JOIN centres_de_cout c ON c.id = mc.centre_cout_id
LEFT JOIN produits p ON p.id = m.produit_id
LEFT JOIN familles f ON f.id = p.famille_id AND f.mama_id = p.mama_id;
GRANT SELECT ON v_analytique_stock TO authenticated;

DROP VIEW IF EXISTS v_besoins_previsionnels;
CREATE VIEW v_besoins_previsionnels AS
SELECT
  m.mama_id,
  m.id AS menu_id,
  fl.produit_id,
  SUM(fl.quantite * COALESCE(f.portions,1)) AS quantite,
  SUM(fl.quantite * COALESCE(f.portions,1) * COALESCE(p.pmp,0)) AS valeur
FROM menus m
JOIN menu_fiches mf ON mf.menu_id = m.id
JOIN fiches f ON f.id = mf.fiche_id
JOIN fiche_lignes fl ON fl.fiche_id = f.id
LEFT JOIN produits p ON p.id = fl.produit_id
GROUP BY m.mama_id, m.id, fl.produit_id;
GRANT SELECT ON v_besoins_previsionnels TO authenticated;

-- Vue mensuelle de la consommation par centre de coût
DROP VIEW IF EXISTS v_centres_cout_mensuel;
CREATE VIEW v_centres_cout_mensuel AS
SELECT
  c.mama_id,
  c.id AS centre_cout_id,
  date_trunc('month', m.created_at) AS mois,
  c.nom,
  c.actif AS centre_cout_actif,
  BOOL_OR(m.actif) AS mouvements_cc_actifs,
  COALESCE(SUM(m.quantite),0) AS quantite,
  COALESCE(SUM(m.valeur),0) AS valeur
FROM centres_de_cout c
LEFT JOIN mouvements_centres_cout m ON m.centre_cout_id = c.id
GROUP BY c.mama_id, c.id, mois, c.nom;
GRANT SELECT ON v_centres_cout_mensuel TO authenticated;

-- Vue alias pour faciliter la lecture par mois
DROP VIEW IF EXISTS v_centres_cout_mois;
CREATE VIEW v_centres_cout_mois AS
SELECT
  mama_id,
  centre_cout_id,
  mois,
  nom,
  centre_cout_actif,
  mouvements_cc_actifs,
  quantite,
  valeur
FROM v_centres_cout_mensuel;
GRANT SELECT ON v_centres_cout_mois TO authenticated;

DROP VIEW IF EXISTS v_cost_center_month;
CREATE VIEW v_cost_center_month AS
SELECT * FROM v_centres_cout_mois;
GRANT SELECT ON v_cost_center_month TO authenticated;

DROP VIEW IF EXISTS v_ecarts_inventaire;
CREATE VIEW v_ecarts_inventaire AS
SELECT
  il.mama_id,
  il.produit_id,
  i.date_inventaire AS date,
  i.zone,
  p.stock_theorique,
  il.quantite AS stock_reel,
  il.quantite - COALESCE(p.stock_theorique,0) AS ecart,
  NULL::text AS motif
FROM inventaire_lignes il
JOIN inventaires i ON i.id = il.inventaire_id
JOIN produits p ON p.id = il.produit_id;
GRANT SELECT ON v_ecarts_inventaire TO authenticated;

-- Fonctions additionnelles necessaires
CREATE OR REPLACE FUNCTION stats_achats_fournisseurs(mama_id_param uuid)
RETURNS TABLE(mois text, total_achats numeric) LANGUAGE sql AS $$
  SELECT to_char(f.date_facture, 'YYYY-MM') AS mois,
         SUM(fl.quantite * fl.prix) AS total_achats
    FROM factures f
      JOIN facture_lignes fl ON fl.facture_id = f.id
   WHERE f.mama_id = mama_id_param
   GROUP BY 1
   ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION stats_achats_fournisseur(mama_id_param uuid, fournisseur_id_param uuid)
RETURNS TABLE(mois text, total_achats numeric) LANGUAGE sql AS $$
  SELECT to_char(f.date_facture, 'YYYY-MM') AS mois,
         SUM(fl.quantite * fl.prix) AS total_achats
    FROM factures f
      JOIN facture_lignes fl ON fl.facture_id = f.id
   WHERE f.mama_id = mama_id_param
     AND f.fournisseur_id = fournisseur_id_param
   GROUP BY 1
   ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION stats_rotation_produit(mama_id_param uuid, produit_id_param uuid)
RETURNS TABLE(mois text, quantite_sortie numeric) LANGUAGE sql AS $$
  SELECT to_char(date, 'YYYY-MM') AS mois,
         SUM(quantite) AS quantite_sortie
    FROM stock_mouvements
   WHERE mama_id = mama_id_param
     AND produit_id = produit_id_param
     AND type = 'sortie'
   GROUP BY 1
   ORDER BY 1;
$$;

-- Ajout colonnes manquantes pour stock_mouvements
-- Création minimale de la table si absente
CREATE TABLE IF NOT EXISTS stock_mouvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  inventaire_id uuid REFERENCES inventaires(id),
  date timestamp with time zone,
  type text,
  quantite numeric,
  produit_id uuid REFERENCES produits(id),
  zone_source_id uuid REFERENCES zones_stock(id),
  zone_destination_id uuid REFERENCES zones_stock(id),
  commentaire text,
  auteur_id uuid REFERENCES utilisateurs(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  actif boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_stock_mouvements_date ON stock_mouvements(date);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_produit ON stock_mouvements(produit_id);
CREATE INDEX IF NOT EXISTS idx_stock_mouvements_mama ON stock_mouvements(mama_id);

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
CREATE INDEX IF NOT EXISTS idx_catalogue_updates_mama ON catalogue_updates(mama_id);
CREATE INDEX IF NOT EXISTS idx_catalogue_updates_fournisseur ON catalogue_updates(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_catalogue_updates_produit ON catalogue_updates(produit_id);

CREATE TABLE IF NOT EXISTS commandes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  fournisseur_id uuid REFERENCES fournisseurs(id),
  statut text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commandes_mama ON commandes(mama_id);
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur ON commandes(fournisseur_id);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  chemin text,
  type text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_mama ON documents(mama_id);

CREATE TABLE IF NOT EXISTS etapes_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  etape text,
  terminee boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_etapes_onboarding_mama ON etapes_onboarding(mama_id);

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
CREATE INDEX IF NOT EXISTS idx_tableaux_de_bord_mama ON tableaux_de_bord(mama_id);

CREATE TABLE IF NOT EXISTS gadgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tableau_id uuid REFERENCES tableaux_de_bord(id),
  type text,
  config jsonb,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gadgets_tableau ON gadgets(tableau_id);

CREATE TABLE IF NOT EXISTS help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  title text,
  content text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_help_articles_mama ON help_articles(mama_id);

CREATE TABLE IF NOT EXISTS lignes_bl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bl_id uuid REFERENCES bons_livraison(id),
  produit_id uuid REFERENCES produits(id),
  quantite numeric,
  prix numeric,
  tva numeric,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lignes_bl_bl ON lignes_bl(bl_id);
CREATE INDEX IF NOT EXISTS idx_lignes_bl_produit ON lignes_bl(produit_id);

CREATE TABLE IF NOT EXISTS planning_previsionnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  date_prevue date,
  quantite numeric,
  produit_id uuid REFERENCES produits(id),
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_planning_previsionnel_mama ON planning_previsionnel(mama_id);
CREATE INDEX IF NOT EXISTS idx_planning_previsionnel_produit ON planning_previsionnel(produit_id);

CREATE TABLE IF NOT EXISTS signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  created_by uuid REFERENCES utilisateurs(id),
  type text,
  description text,
  date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_signalements_mama ON signalements(mama_id);

CREATE TABLE IF NOT EXISTS validation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  user_id uuid REFERENCES utilisateurs(id),
  module text,
  payload jsonb,
  statut text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_validation_requests_mama ON validation_requests(mama_id);

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
CREATE INDEX IF NOT EXISTS idx_api_keys_mama ON api_keys(mama_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

CREATE TABLE IF NOT EXISTS compta_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  cle text,
  compte text,
  type text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compta_mapping_mama ON compta_mapping(mama_id);

-- Vues supplémentaires utilisées par les hooks React
DROP VIEW IF EXISTS v_reco_rotation;
CREATE VIEW v_reco_rotation AS
SELECT
  p.id AS produit_id,
  p.nom,
  p.mama_id,
  p.actif AS produit_actif,
  current_date - COALESCE(MAX(m.date), current_date) AS jours_inactif
FROM produits p
LEFT JOIN stock_mouvements m ON m.produit_id = p.id
WHERE p.actif = true
GROUP BY p.id, p.nom, p.mama_id, p.actif;
GRANT SELECT ON v_reco_rotation TO authenticated;

DROP VIEW IF EXISTS v_reco_stockmort;
CREATE VIEW v_reco_stockmort AS
SELECT
  produit_id,
  nom,
  mama_id,
  produit_actif,
  jours_inactif
FROM v_reco_rotation
WHERE jours_inactif > 30;
GRANT SELECT ON v_reco_stockmort TO authenticated;

-- Vue de recommandation surcoût
DROP VIEW IF EXISTS v_reco_surcout;
CREATE VIEW v_reco_surcout AS
SELECT DISTINCT ON (sp.produit_id)
  sp.produit_id,
  p.nom,
  p.mama_id,
  p.actif AS produit_actif,
  sp.actif AS fournisseur_produit_actif,
  sp.prix_achat AS dernier_prix,
  LAG(sp.prix_achat) OVER (PARTITION BY sp.produit_id ORDER BY sp.date_livraison) AS prix_precedent,
  (sp.prix_achat - LAG(sp.prix_achat) OVER (PARTITION BY sp.produit_id ORDER BY sp.date_livraison))
    / NULLIF(LAG(sp.prix_achat) OVER (PARTITION BY sp.produit_id ORDER BY sp.date_livraison),0) * 100 AS variation_pct
FROM fournisseur_produits sp
JOIN produits p ON p.id = sp.produit_id
WHERE p.actif = true
ORDER BY sp.produit_id, sp.date_livraison DESC;
GRANT SELECT ON v_reco_surcout TO authenticated;

DROP VIEW IF EXISTS v_cost_center_monthly;
CREATE VIEW v_cost_center_monthly AS
SELECT * FROM v_centres_cout_mensuel;
GRANT SELECT ON v_cost_center_monthly TO authenticated;

DROP VIEW IF EXISTS v_fournisseurs_inactifs;
CREATE VIEW v_fournisseurs_inactifs AS
SELECT
  f.mama_id,
  f.id AS fournisseur_id,
  f.nom,
  f.actif AS fournisseur_actif,
  BOOL_OR(fc.actif) AS facture_actif,
  MAX(fc.date_facture) AS dernier_achat
FROM fournisseurs f
LEFT JOIN factures fc ON fc.fournisseur_id = f.id
WHERE f.mama_id IS NOT NULL
GROUP BY f.mama_id, f.id, f.nom
HAVING COALESCE(MAX(fc.date_facture), current_date - interval '999 months') < current_date - interval '6 months';
GRANT SELECT ON v_fournisseurs_inactifs TO authenticated;

DROP VIEW IF EXISTS v_monthly_purchases;
CREATE VIEW v_monthly_purchases AS
SELECT
  f.mama_id,
  to_char(f.date_facture,'YYYY-MM') AS mois,
  SUM(fl.quantite * fl.prix) AS total
FROM factures f
JOIN facture_lignes fl ON fl.facture_id = f.id
GROUP BY f.mama_id, mois;
GRANT SELECT ON v_monthly_purchases TO authenticated;

DROP VIEW IF EXISTS v_pmp;
CREATE VIEW v_pmp AS
SELECT
  p.mama_id,
  p.id AS produit_id,
  p.actif AS produit_actif,
  BOOL_OR(sp.actif) AS fournisseur_produit_actif,
  COALESCE(AVG(sp.prix_achat),0) AS pmp
FROM produits p
LEFT JOIN fournisseur_produits sp ON sp.produit_id = p.id AND sp.mama_id = p.mama_id
GROUP BY p.mama_id, p.id, p.actif;
GRANT SELECT ON v_pmp TO authenticated;
-- Vue pour derniers prix produits utilisée dans plusieurs hooks

-- Correction de la vue v_produits_dernier_prix pour éviter l'erreur "date_livraison does not exist"

DROP VIEW IF EXISTS v_produits_dernier_prix;

-- S'assurer que la table fournisseur_produits existe avant d'ajouter les colonnes
CREATE TABLE IF NOT EXISTS fournisseur_produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid REFERENCES produits(id),
  fournisseur_id uuid REFERENCES fournisseurs(id),
  mama_id uuid REFERENCES mamas(id),
  prix_achat numeric,
  date_livraison date,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  actif boolean DEFAULT true,
  UNIQUE(produit_id, fournisseur_id, date_livraison)
);

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
GRANT SELECT ON v_produits_dernier_prix TO authenticated;



DROP VIEW IF EXISTS v_tendance_prix_produit;
CREATE VIEW v_tendance_prix_produit AS
SELECT
  fl.mama_id,
  fl.produit_id,
  date_trunc('month', f.date_facture) AS mois,
  BOOL_OR(fl.actif) AS facture_ligne_actif,
  BOOL_OR(f.actif) AS facture_actif,
  AVG(fl.prix) AS prix_moyen
FROM facture_lignes fl
JOIN factures f ON f.id = fl.facture_id
GROUP BY fl.mama_id, fl.produit_id, mois;
GRANT SELECT ON v_tendance_prix_produit TO authenticated;

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
CREATE INDEX IF NOT EXISTS idx_feedback_mama ON feedback(mama_id);

-- Colonnes supplémentaires pour l'historique des prix fournisseurs

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
CREATE INDEX IF NOT EXISTS idx_tooltips_mama ON tooltips(mama_id);

CREATE TABLE IF NOT EXISTS documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mama_id uuid REFERENCES mamas(id),
  titre text,
  contenu text,
  categorie text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documentation_mama ON documentation(mama_id);

CREATE TABLE IF NOT EXISTS guides_seen (
  user_id uuid REFERENCES utilisateurs(id),
  mama_id uuid REFERENCES mamas(id),
  module text,
  seen boolean DEFAULT false,
  PRIMARY KEY (user_id, module)
);
CREATE INDEX IF NOT EXISTS idx_guides_seen_user ON guides_seen(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_seen_mama ON guides_seen(mama_id);

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

-- Réactivation des contrôles sur le corps des fonctions pour
-- sécuriser les exécutions suivantes
SET check_function_bodies = on;
