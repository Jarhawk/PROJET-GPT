-- Ajouts complémentaires pour le back-end Supabase
-- Gestion des zones de stockage
create table if not exists zones_stock (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id) on delete cascade,
  nom text not null,
  actif boolean default true,
  created_at timestamptz default now()
);

alter table produits
  add column if not exists zone_stock_id uuid references zones_stock(id) on delete set null;

-- Ajout colonne manquante pour stocker la configuration du tableau de bord
ALTER TABLE tableaux_de_bord ADD COLUMN IF NOT EXISTS liste_gadgets_json jsonb DEFAULT '[]'::jsonb;

-- Ajout colonne justificatif pour stocker l'URL de la pièce jointe de facture
ALTER TABLE factures ADD COLUMN IF NOT EXISTS justificatif text;

-- Ajout champ pour hiérarchie Famille / Sous-famille
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'familles' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE familles RENAME COLUMN parent_id TO famille_parent_id;
  END IF;
END $$;

ALTER TABLE familles
  ADD COLUMN IF NOT EXISTS famille_parent_id uuid REFERENCES familles(id);

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

-- Ajout/ajustement du module planning prévisionnel
ALTER TABLE planning_previsionnel
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
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planning_lignes_mama_id ON planning_lignes(mama_id);

-- Politiques RLS pour le planning
ALTER TABLE planning_previsionnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY planning_previsionnel_select ON planning_previsionnel
  FOR SELECT USING (mama_id = current_user_mama_id());

CREATE POLICY planning_previsionnel_insert ON planning_previsionnel
  FOR INSERT WITH CHECK (mama_id = current_user_mama_id());

CREATE POLICY planning_previsionnel_update ON planning_previsionnel
  FOR UPDATE USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

CREATE POLICY planning_previsionnel_delete ON planning_previsionnel
  FOR DELETE USING (mama_id = current_user_mama_id());

CREATE POLICY planning_lignes_select ON planning_lignes
  FOR SELECT USING (mama_id = current_user_mama_id());

CREATE POLICY planning_lignes_insert ON planning_lignes
  FOR INSERT WITH CHECK (mama_id = current_user_mama_id());

CREATE POLICY planning_lignes_update ON planning_lignes
  FOR UPDATE USING (mama_id = current_user_mama_id())
  WITH CHECK (mama_id = current_user_mama_id());

CREATE POLICY planning_lignes_delete ON planning_lignes
  FOR DELETE USING (mama_id = current_user_mama_id());

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

-- Vue v_produits_dernier_prix pour récupérer le dernier prix fournisseur
CREATE OR REPLACE VIEW v_produits_dernier_prix AS
SELECT
  p.id,
  p.nom,
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

-- Ajout colonne url_photo pour stocker l'URL de la photo produit
ALTER TABLE produits ADD COLUMN IF NOT EXISTS url_photo text;

-- ⚠️ Pour forcer Supabase à rafraîchir le schema cache
alter table produits add column if not exists temp_refresh_trigger integer;
alter table produits drop column if exists temp_refresh_trigger;

-- Forcer le refresh du cache des relations
alter table produits alter column famille_id drop not null;
alter table produits alter column famille_id set not null;

-- Vue simplifiée pour les réquisitions avec informations produit
-- AJOUT POUR DASHBOARD
DROP VIEW IF EXISTS v_requisitions;
CREATE VIEW v_requisitions AS
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


-- Politiques RLS pour la table utilisateurs
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS utilisateurs_select ON utilisateurs FOR SELECT USING (mama_id = current_user_mama_id());
CREATE POLICY IF NOT EXISTS utilisateurs_insert ON utilisateurs FOR INSERT WITH CHECK (mama_id = current_user_mama_id());
CREATE POLICY IF NOT EXISTS utilisateurs_update ON utilisateurs FOR UPDATE USING (mama_id = current_user_mama_id()) WITH CHECK (mama_id = current_user_mama_id());
CREATE POLICY IF NOT EXISTS utilisateurs_delete ON utilisateurs FOR DELETE USING (mama_id = current_user_mama_id());

-- Vue d'évolution des achats (par mois)
DROP VIEW IF EXISTS v_evolution_achats;
CREATE VIEW v_evolution_achats AS
SELECT
  a.mama_id,
  date_trunc('month', a.date_achat)::date AS mois,
  SUM(a.prix * a.quantite) AS montant
FROM achats a
WHERE a.actif IS TRUE
GROUP BY a.mama_id, mois
ORDER BY mois;


-- Gestion des suppressions et politiques RLS pour familles, sous-familles et unités
alter table familles enable row level security;
alter table sous_familles enable row level security;
alter table unites enable row level security;

drop policy if exists delete_familles on familles;
create policy delete_familles on familles
for delete to authenticated
using (mama_id = current_user_mama_id());

drop policy if exists delete_sous_familles on sous_familles;
create policy delete_sous_familles on sous_familles
for delete to authenticated
using (mama_id = current_user_mama_id());

drop policy if exists delete_unites on unites;
create policy delete_unites on unites
for delete to authenticated
using (mama_id = current_user_mama_id());

-- Ajustement des contraintes de clé étrangère pour permettre la suppression
alter table produits drop constraint if exists fk_produits_famille;
alter table produits add constraint fk_produits_famille
  foreign key (famille_id) references familles(id)
  on delete set null;

alter table produits drop constraint if exists fk_produits_sous_famille;
alter table produits add constraint fk_produits_sous_famille
  foreign key (sous_famille_id) references sous_familles(id)
  on delete set null;

alter table produits drop constraint if exists fk_produits_unite;
alter table produits add constraint fk_produits_unite
  foreign key (unite_id) references unites(id)
  on delete set null;

