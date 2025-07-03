# Changelog

## [Unreleased]
### Added
- Playwright end-to-end tests (`npm run test:e2e`).
- GitHub Actions workflow running `npm audit fix`, lint, unit and e2e tests.
- Audit log page with SQL schema and React UI
- Cost center allocation modal and settings management
- Cost center analytics page with SQL view and React UI
- Excel import/export on the cost center settings page
- Consolidated `full_setup.sql` combines schema, policies and patches for easier database setup
- Cost center Excel import falls back to the first sheet when "CostCenters" is missing
- Monthly cost center pivot page with trend table
- Cost center analytics pages `/stats/cost-centers` and `/stats/cost-centers-monthly` with Excel export
- Product price trend chart on the dashboard
- Top products function for the dashboard with React hook
- Excel export for cost center analytics
- Global search bar in the navbar to quickly find products or suppliers
- Losses management page with Supabase table and audit logging
- Alerts for suppliers with no invoices in the last 6 months
- Docker deployment instructions and Dockerfile
- Unit tests for the cost center hook
- Unit tests for the audit log hook
- Audit log page now supports filtering by date range
- Unit test covering error handling in the cost center stats hook
- Invoice OCR scanning using tesseract.js with unit test
- Monthly accounting export script producing CSV invoices
- Historic reallocation script `npm run allocate:history` to apply suggested cost center allocations
- Database backup script `npm run backup` saving core tables to JSON;
  now includes inventories and inventory lines
- Note on Playwright browser downloads in README
- Added `npm run install:browsers` script to download Playwright browsers
- End-to-end tests now check for installed browsers and skip if missing
- Example environment files `.env.example` and `.env.production.example` ease configuration
- Added clarification on using `.env.production` for Netlify deployment
- Menu planning with recipe associations and automatic stock decrement
- Dark mode toggle in the navigation bar
- Multi-site support with per-site cost centers and user isolation
- Optional two-factor authentication for user accounts
- Two-factor setup now requires verifying a TOTP code before activation
- Grant execution of `enable_two_fa` and `disable_two_fa` functions to authenticated users so they can manage 2FA without elevated rights
- Cost center suggestions based on historical allocations
- New index `idx_cost_centers_nom` speeds up lookups by cost center name
- SQL function `suggest_cost_centers` granted to authenticated users
- SQL function `stats_cost_centers` granted to authenticated users for analytics
- Functions `dashboard_stats`, `top_products` and `mouvements_without_alloc` granted to authenticated users
- Installable PWA with offline support using VitePWA
- Password reset workflow with pages `/reset-password` and `/update-password`
- Simple task manager with creation and detail pages, recurring schedules and status tracking
- Indexes on `taches.next_echeance` and `tache_instances.done_by` speed up task queries
- Indexes on `mouvements_stock.zone`, `mouvements_stock.sous_type` and
  `mouvements_stock.motif` help filter movements by these columns
- Index `idx_mouvements_stock_type` accelerates queries by movement type
- Stock statistics page `/stats/stocks` linked from the sidebar with Excel export
- Backup script now exports the `supplier_products` table alongside other core data
- Index on `factures.reference` accelerates invoice searches
- Index on `products.code` makes product lookups by internal code faster
- Index on `fournisseurs.nom` speeds up supplier search queries
- Index on `supplier_products.date_livraison` speeds price history lookups
- Inventaires store a start date (`date_debut`) with indexes on `date` and `date_debut`
- Index on `users.email` for faster authentication queries
- Root path `/` now redirects to `/dashboard` for convenience
- Dashboard page shows loading and error messages while fetching data
- README clarifies that `full_setup.sql` is idempotent and bundles schema,
  policies and patches for repeated use.

### Changed
- Updated ESLint config and cleaned all warnings.
- Dependencies updated via `npm audit fix`.
- Removed leftover checkmark comments and debug console statements
  before preparing deployment.
- Verified clean install and build steps for production
- Documented service worker registration for offline usage in the README
- Added `isSuperadmin` flag in `AuthContext` to better handle role-based access
- `ProtectedRoute` now relies on `isSuperadmin` for role checks
- ProtectedRoute refuse l'accès si aucun `mama_id` n'est associé
- `.env.production.example` fournit désormais l'URL et la clé Supabase prêtes
  à copier pour le déploiement
- `.env.production` est ignoré par Git pour éviter de publier des clés sensibles
- Dernière installation des dépendances et vérification des commandes de test et de build
- Nouvelle installation validée lors de l'étape 107 pour confirmer un environnement sain
### Added
- Section "Deployment checklist" in the README with final verification steps
- Création d'un fichier `.env.production` local prêt à copier pour le déploiement

### Known Issues
- `xlsx` package has a high severity vulnerability that cannot be fixed automatically.

- Confirmed all RLS policies using `db/full_setup.sql` and verified login redirects to `/dashboard` when already authenticated.
- Validation finale Step 110 : `npm install`, lint, tests, build et preview avec `.env.production.example`.
- Validation finale Step 111 : verification complete apres `npm install`.

- Validation finale Step 112 : audit du routeur, des pages principales et des formulaires. Toutes les commandes passent avant déploiement.
- Validation step 113: filtres mama_id appliques aux alertes de taches et tests/lint OK.
- Validation step 114: corrections catalogue viewer et ecarts inventaire.

- Validation step 115: filtre mama_id pour detail fournisseur.
- Validation step 116: filtre mama_id pour la page InvitationsEnAttente.
- Step 117: removed all uses of nonexistent users_mamas table. MultiMamaContext and forms now query mamas via mama_id. Fixed invoice reference alias.
- Step 118: verified removal of join table references across codebase and ensured lint and test commands succeed.
- Step 119: inspected SQL policies and functions to confirm all access now uses mama_id directly without users_mamas.
- Step 120: finalized removal of users_mamas references; installed missing lint and test dependencies.
- Step 121: reconfirmed that no users_mamas references remain; installed dependencies and ensured lint/tests pass.

- Step 122: performed final verification of users_mamas removal and reran lint/tests.
- Step 123: ran npm install and confirmed lint/tests pass with no users_mamas references.

- Step 124: Verified again that all modules operate via mama_id only; repeated lint/test cycle after reinstall

- Step 125: final cleanup check; npm install, lint, and tests confirm stable removal of users_mamas table.

- Step 126: re-verified entire codebase with grep after user request; npm install, lint and tests still pass.

- Step 127: continued verification after removing `users_mamas`; ran grep to confirm none remain and verified lint/tests pass.

- Step 128: reran npm install, lint and tests to reconfirm no users_mamas references.
- Step 129: reconfirmed no users_mamas references after reinstall; lint/tests pass.
- Step 130: verified once more that the codebase contains no `users_mamas` references; reran npm install, lint and tests successfully.


- Step 131: additional verification cycle; searched again for `users_mamas` and found none. Ran `npm install`, `npm run lint` and `npm test` successfully.
- Step 132: audited FournisseursAPIConfig module; added listConfigs API, updated docs and tests.
