# Actif Column Verification

This project uses an `actif` boolean field on many tables. Some environments were missing the column, resulting in `42703: column "actif" does not exist` errors.

## Checked tables
The following tables are used in queries with the `actif` column. If any column is missing, reapply `db/full_setup.sql`:
- users
- utilisateurs
- fournisseurs
- produits
- familles
- fiches
- fiches_techniques
- zones_stock
- permissions
- menus
- mamas
- roles
- centres_de_cout
- promotions
- alert_rules
- taches
- fournisseurs_api_config

All `ALTER TABLE` statements ensuring the column exists are included directly in `db/full_setup.sql` without `DO $$` blocks for maximum compatibility.

## Status

| Table | Etat |
|-------|------|
| users | OK |
| utilisateurs | OK |
| fournisseurs | OK |
| produits | OK |
| familles | AJOUTÉE |
| fiches | OK |
| fiches_techniques | OK |
| zones_stock | OK |
| permissions | OK |
| menus | OK |
| mamas | AJOUTÉE |
| roles | OK |
| centres_de_cout | OK |
| promotions | OK |
| alert_rules | OK |
| taches | AJOUTÉE |
| fournisseurs_api_config | OK |

`db/full_setup.sql` also migrates the old `alert_rules.enabled` column when present before dropping it.
