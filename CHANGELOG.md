# Changelog

## [Unreleased]
### Added
- Playwright end-to-end tests (`npm run test:e2e`).
- GitHub Actions workflow running `npm audit fix`, lint, unit and e2e tests.
- Audit log page with SQL schema and React UI
- Cost center allocation modal and settings management
- Cost center analytics page with SQL view and React UI
- Excel import/export on the cost center settings page
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

### Changed
- Updated ESLint config and cleaned all warnings.
- Dependencies updated via `npm audit fix`.

### Known Issues
- `xlsx` package has a high severity vulnerability that cannot be fixed automatically.
