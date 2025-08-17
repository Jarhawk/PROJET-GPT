-- Enable trigram extension and indexes to speed up product searches
create extension if not exists pg_trgm;

-- Trigram index on product name (case-insensitive)
create index if not exists produits_nom_trgm_idx
  on public.produits using gin (lower(nom) gin_trgm_ops);

-- Index on mama_id for efficient organisation filtering
create index if not exists produits_mama_id_idx on public.produits (mama_id);
