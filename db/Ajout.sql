-- Ajouts complémentaires pour le back-end Supabase
-- Ajout colonne manquante pour stocker la configuration du tableau de bord
ALTER TABLE tableaux_de_bord ADD COLUMN IF NOT EXISTS liste_gadgets_json jsonb DEFAULT '[]'::jsonb;

-- Ajout colonne justificatif pour stocker l'URL de la pièce jointe de facture
ALTER TABLE factures ADD COLUMN IF NOT EXISTS justificatif text;

-- Synchronisation des modules d'accès
INSERT INTO permissions(module, droit)
VALUES
  ('achats', 'peut_voir'),
  ('bons_livraison', 'peut_voir'),
  ('planning_previsionnel', 'peut_voir'),
  ('fiches_techniques', 'peut_voir'),
  ('stats', 'peut_voir'),
  ('consolidation', 'peut_voir'),
  ('menu_engineering', 'peut_voir'),
  ('zones_stock', 'peut_voir'),
  ('licences', 'peut_voir'),
  ('parametrage', 'peut_voir'),
  ('feedback', 'peut_voir'),
  ('logs', 'peut_voir'),
  ('audit', 'peut_voir')
ON CONFLICT DO NOTHING;

-- Ajout des modules manquants pour homogénéiser les droits
INSERT INTO permissions(module, droit)
VALUES
  ('dashboard', 'peut_voir'),
  ('produits', 'peut_voir'),
  ('fournisseurs', 'peut_voir'),
  ('factures', 'peut_voir'),
  ('receptions', 'peut_voir'),
  ('inventaires', 'peut_voir'),
  ('mouvements', 'peut_voir'),
  ('menus', 'peut_voir'),
  ('carte', 'peut_voir'),
  ('recettes', 'peut_voir'),
  ('requisitions', 'peut_voir'),
  ('promotions', 'peut_voir'),
  ('notifications', 'peut_voir'),
  ('documents', 'peut_voir'),
  ('planning', 'peut_voir'),
  ('taches', 'peut_voir'),
  ('alertes', 'peut_voir'),
  ('analyse', 'peut_voir'),
  ('reporting', 'peut_voir'),
  ('utilisateurs', 'peut_voir'),
  ('roles', 'peut_voir'),
  ('mamas', 'peut_voir'),
  ('permissions', 'peut_voir'),
  ('settings', 'peut_voir'),
  ('apikeys', 'peut_voir'),
  ('access', 'peut_voir'),
  ('aide', 'peut_voir')
ON CONFLICT DO NOTHING;
