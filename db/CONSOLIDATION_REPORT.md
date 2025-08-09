# Consolidation Report

## Removals
- Dropped legacy tables `mouvements` and `mouvements_centres_cout` along with related indexes, RLS policies and grants.
- Removed unused placeholder views `v_menu_engineering` and `v_consolidated_stats`.

## Rewritten / New Objects
- Standardised UUID generation to `gen_random_uuid()` and removed `uuid-ossp` extension.
- Unified timestamp handling with `public.trg_set_timestamp` trigger function.
- Replaced `update_timestamp_roles` trigger with `trg_set_timestamp` on all tables.
- Simplified `create_utilisateur` to a single signature `public.create_utilisateur(p_email text, p_nom text, p_role_id uuid, p_mama_id uuid)` and dropped the empty variant.
- Rebuilt stock view `v_stocks` using achats, transferts and requisitions.
- Reimplemented `top_produits` function based on requisitions.
- Added business views used by the frontend:
  - `v_products_last_price`
  - `v_fournisseurs_inactifs`
  - `v_taches_assignees`
  - `v_couts_fiches`
  - `v_stock_requisitionne`
  - `v_produits_utilises`
  - `v_reco_stockmort`
  - `v_reco_surcout`
  - `v_tendance_prix_produit`
  - `v_top_fournisseurs`
  - `v_analytique_stock`
  - `v_besoins_previsionnels`
  - `v_boissons`
  - `v_cost_center_month`
  - `v_cost_center_monthly`
  - `v_performance_fiches`
- Placeholder functions still required by the front now raise `NOTICE 'TODO'` instead of returning silently.

## Policies
- Added strict insert policy on `requisitions` limiting zone types to `cave` or `shop`.

## Notes
- Several analytical views are implemented with minimal placeholders and return empty sets until proper logic is defined.
