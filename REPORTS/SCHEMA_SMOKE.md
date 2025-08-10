# Schema smoke test

## Tables
- requisitions: KO (Missing Supabase credentials)
- requisition_lignes: KO (Missing Supabase credentials)
- commandes: KO (Missing Supabase credentials)
- commande_lignes: KO (Missing Supabase credentials)
- zones_stock: KO (Missing Supabase credentials)
- produits: KO (Missing Supabase credentials)
- periodes_comptables: KO (Missing Supabase credentials)
- utilisateurs: KO (Missing Supabase credentials)
- roles: KO (Missing Supabase credentials)

## Columns
- zones_stock.position not null default 0: KO (Missing Supabase credentials)
- requisitions.mama_id: KO (Missing Supabase credentials)
- requisition_lignes.mama_id: KO (Missing Supabase credentials)
- commandes.mama_id: KO (Missing Supabase credentials)
- commande_lignes.mama_id: KO (Missing Supabase credentials)
- zones_stock.mama_id: KO (Missing Supabase credentials)
- produits.mama_id: KO (Missing Supabase credentials)
- periodes_comptables.mama_id: KO (Missing Supabase credentials)
- utilisateurs.mama_id: KO (Missing Supabase credentials)
- roles.mama_id: KO (Missing Supabase credentials)

## Functions
- current_user_mama_id: KO (Missing Supabase credentials)
- current_user_is_admin_or_manager: KO (Missing Supabase credentials)
- current_user_is_admin: KO (Missing Supabase credentials)

## Policies
- requisitions_select: KO (Missing Supabase credentials)
- zones_stock_select: KO (Missing Supabase credentials)

## Views
- v_products_last_price: KO (Missing Supabase credentials)
- v_fournisseurs_inactifs: KO (Missing Supabase credentials)
- v_taches_assignees: KO (Missing Supabase credentials)
- v_costing_carte: KO (Missing Supabase credentials)
- v_menu_groupe_resume: KO (Missing Supabase credentials)
- v_stocks: KO (Missing Supabase credentials)
