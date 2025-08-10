# Schema Single Report

Summary of adjustments in `db/full_setup_final.sql`:

- Reordered schema setup so foreign keys precede indexes.
- Added missing function `current_user_is_admin()` and granted execution rights for user context helper functions.
- Ensured timestamp triggers are idempotent and created only if absent.
- Replaced `utilisateurs_complets` and `v_produits_par_zone` views with explicit column lists for compatibility.
- Recorded grants for the new and existing helper functions.

No tables were dropped in this pass.

