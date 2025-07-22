-- Ajouts complémentaires pour le back-end Supabase
-- Ajout colonne manquante pour stocker la configuration du tableau de bord
ALTER TABLE tableaux_de_bord ADD COLUMN IF NOT EXISTS liste_gadgets_json jsonb DEFAULT '[]'::jsonb;

-- Ajout colonne justificatif pour stocker l'URL de la pièce jointe de facture
ALTER TABLE factures ADD COLUMN IF NOT EXISTS justificatif text;
