# Schema Consolidation Report

## Added Columns
- `public.commandes.created_by uuid` (FK to `public.utilisateurs.id`)
- `public.commandes.validated_by uuid` (FK to `public.utilisateurs.id`)
- `public.produits.sous_famille_id uuid` (FK to `public.sous_familles.id`)
- `public.produits.zone_id uuid` (FK to `public.zones_stock.id`)

## Foreign Keys
- Regenerated foreign keys for the above columns when missing.

## Views / Triggers / Policies
- No changes beyond existing definitions; ensured idempotent creation.

## Removed Tables
- None.

## Notes
- All other SQL files in `db/` were removed to keep a single `full_setup_final.sql`.
