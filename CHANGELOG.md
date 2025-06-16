# Changelog

## [Unreleased]
### Added
- Playwright end-to-end tests (`npm run test:e2e`).
- GitHub Actions workflow running `npm audit fix`, lint, unit and e2e tests.
- Audit log page with SQL schema and React UI
- Cost center allocation modal and settings management
- Cost center analytics page with SQL view and React UI
- Cost center analytics page now supports filtering by date range
- Excel import/export on the cost center settings page
- Cost center Excel import falls back to the first sheet when "CostCenters" is missing
- Monthly cost center pivot page with trend table
- Product price trend chart on the dashboard
- Top products function for the dashboard with React hook
- Dashboard widgets now show invoice and supplier counts
- Quick action buttons on the dashboard to create products, invoices or inventories
- Supplier statistics page summarising total purchase amounts
- Excel export for cost center analytics
- Global search bar in the navbar to quickly find products or suppliers
- Ability to mark products as favorites with a local filter
- Losses management page with Supabase table and audit logging
- Alerts for suppliers with no invoices in the last 6 months
- Docker deployment instructions and Dockerfile
- Unit tests for the cost center hook
- Unit tests for the audit log hook
- Audit log page now supports filtering by date range
- Unit test covering error handling in the cost center stats hook
- Cost center stats hook now logs RPC errors to the console
- Invoice OCR scanning using tesseract.js with unit test
- Monthly accounting export script producing CSV invoices
- Historic reallocation script `npm run allocate:history` to apply suggested cost center allocations
- New page `/mouvements/ventilation` listing movements without allocations
- Database backup script `npm run backup` saving core tables to JSON
- SFTP upload script `npm run upload:sftp <file>` for sending reports
- Note on Playwright browser downloads in README
- Added `npm run install:browsers` script to download Playwright browsers
- End-to-end tests now check for installed browsers and skip if missing
- Menu planning with recipe associations and automatic stock decrement
- Dark mode toggle in the navigation bar
- Multi-site support with per-site cost centers and user isolation
- Optional two-factor authentication for user accounts
- Two-factor setup now requires verifying a TOTP code before activation
- Cost center suggestions based on historical allocations
- Installable PWA with offline support using VitePWA
- Audit log viewer highlights destructive actions in red

### Changed
- Updated ESLint config and cleaned all warnings.
- Dependencies updated via `npm audit fix`.

### Known Issues
- `xlsx` package has a high severity vulnerability that cannot be fixed automatically.
