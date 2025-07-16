-- Mise à niveau du schéma pour correspondre au front-end

-- Table documents : ajout des colonnes manquantes
alter table if exists documents
  add column if not exists nom text,
  add column if not exists url text,
  add column if not exists taille numeric,
  add column if not exists categorie text,
  add column if not exists entite_liee_type text,
  add column if not exists entite_liee_id uuid,
  add column if not exists uploaded_by uuid references utilisateurs(id),
  add column if not exists actif boolean default true;

update documents set url = coalesce(url, chemin);

-- Table help_articles : aucune modification necessaire, on conserve
-- les colonnes `titre` et `contenu` deja utilisees par le front-end

-- Table mamas : ajout des colonnes de parametrage utilisees par le front
alter table if exists mamas
  add column if not exists logo_url text,
  add column if not exists primary_color text,
  add column if not exists secondary_color text,
  add column if not exists email_envoi text,
  add column if not exists email_alertes text,
  add column if not exists dark_mode boolean default false,
  add column if not exists langue text,
  add column if not exists monnaie text,
  add column if not exists timezone text,
  add column if not exists rgpd_text text,
  add column if not exists mentions_legales text;
