# MamaStock

React application using Supabase. The toolchain relies on modern ESM modules and
requires **Node.js 18+** (see `package.json` engines field).

## Development

```bash
npm install
npm run dev
npm run lint
npm test
npm run test:e2e
npm run build
npm run preview
```

If linting or tests fail because required packages are missing, simply run
`npm install` again. This ensures `vitest`, `@eslint/js` and `playwright` are
available before running the commands above.

### Database

SQL scripts are stored in [`sql/`](./sql). To initialise a local Supabase instance:

```bash
supabase start
supabase db reset --file sql/init.sql --seed sql/seed.sql
psql "$SUPABASE_DB_URL" -f sql/rls.sql
psql "$SUPABASE_DB_URL" -f sql/mama_stock_patch.sql
```

Adjust configuration in `supabase/config.toml` as required.

### Environment variables

Create a `.env` file at the project root with your Supabase credentials. For
development this repository already includes default values:

```env
VITE_SUPABASE_URL=https://jhpfdeolleprmvtchoxt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocGZkZW9sbGVwcm12dGNob3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjI4MzMsImV4cCI6MjA2MjI5ODgzM30.f_J81QTBK4cvFoFUvlY6XNmuS5DSMLUdT_ZQQ7FpOFQ
```

These variables are loaded by Vite during development and build.

The `.env` file is not tracked by Git, so you can safely replace these
defaults with your own credentials for local development.

## Tests

Unit tests run with `vitest`:

```bash
npm test
```

End-to-end tests use Playwright and require your `.env` Supabase credentials:

```bash
npm run test:e2e
```

End-to-end tests rely on Playwright browsers. First-time runs require downloading them:

```bash
npm run install:browsers
```

If this command fails due to restricted network access, manually copy the
browser binaries from another machine or configure the environment to allow
downloads from `cdn.playwright.dev`.

Running `npm run test:e2e` automatically skips the tests when browsers are missing.

The Playwright configuration automatically starts the dev server.

## Features
- Dashboard overview at `/dashboard` (root `/` redirects here) with KPI widgets,
  stock alerts and trend charts
- Supplier price comparison with average and latest purchase metrics
- Comparison page available at `/fournisseurs/comparatif` and linked from the sidebar
- Upload and delete files via Supabase Storage using `useStorage`, with automatic cleanup of replaced uploads
- Daily menu handling provided by `useMenuDuJour`
- Menu planning with recipe associations, production planning and automatic stock decrement
- PDF export for invoices and fiches techniques using jsPDF
- Forms display links to preview uploaded documents immediately
- Product management supports codes, allergens and photo upload
- Products track a minimum stock level for dashboard alerts
- Product list features pagination, sortable columns, filters, quick duplication of existing entries and Excel import/export (the importer reads the first sheet if no "Produits" sheet is found)
- Manage products from `/produits` with creation and detail pages at
  `/produits/nouveau` and `/produits/:id`
- Each product records supplier prices and automatically updates its PMP
- Stock and movement history available from the product detail modal
- Supplier list supports Excel/PDF export and highlights inactive suppliers
- Alerts for suppliers with no invoices in the last 6 months
- Stock detail charts show monthly product rotation
- Stock movement management available at `/mouvements`
- Indexes on `mouvements_stock.type`, `zone`, `sous_type` and `motif` speed up filtering
- Audit log viewer with date and text filters plus Excel export, accessible from the sidebar
- Cost center management with allocation modal and dedicated settings page
- Cost centers can be imported or exported via Excel in the settings page (the importer falls back to the first sheet if no "CostCenters" sheet is present)
- Cost center analytics page summarising allocations by value and quantity with graceful error handling (tested for RPC errors)
- Cost center analytics pages available at `/stats/cost-centers` and `/stats/cost-centers-monthly` with Excel export
- Analytics tables can be exported to Excel for further reporting
- Loss management page to record wastage, breakage and donations with cost center tracking
- Monthly cost center pivot with columns per month for trend analysis
- Dashboard chart showing monthly purchase price trends per product
- Dashboard pie chart highlights top consumed products over the last month
- Inventory management with start/end dates accessible from `/inventaire` and `/inventaire/nouveau`; indexes speed up lookups on `date` and `date_debut`
- Stock statistics page `/stats/stocks` uses the `dashboard_stats` RPC and offers Excel export from the sidebar
- Simple task manager available at `/taches` with creation and detail pages at `/taches/nouveau` and `/taches/:id`
- Indexes on `taches.next_echeance` and `tache_instances.done_by` speed up task queries
- Invoice form supports OCR scanning of uploaded documents
- Manage invoices from `/factures` with pages `/factures/nouveau` and `/factures/:id`
- Index on `factures.reference` speeds up invoice search queries
- Index on `products.code` speeds up lookups by internal product code
- Index on `fournisseurs.nom` speeds up supplier search queries
- Automatic audit triggers log cost center changes and allocations
- Cost center allocation modal offers suggestions based on historical data
- SQL function `suggest_cost_centers` is granted to authenticated users for these recommendations
- SQL function `stats_cost_centers` can be executed by any authenticated user for cost center analytics
- Dashboard analytics functions `dashboard_stats`, `top_products` and `mouvements_without_alloc` are also executable by authenticated users
- Command `npm run allocate:history` applies those suggestions to past movements
- Global search bar in the navbar to quickly find products or suppliers
- Built-in dark mode toggle for better accessibility
- Password reset link on the login form points to `/reset-password` and the flow continues on `/update-password`
- Optional two-factor authentication (TOTP) for user accounts, verified via QR code before activation
- Functions `enable_two_fa` and `disable_two_fa` can be executed by any authenticated user for self-service 2FA
- Multi-site support with per-site cost centers and data isolation
- Installable PWA with offline support
- Index on `users.email` speeds up login queries

## Password reset

1. Visit `/reset-password` to request a magic link by email.
2. Follow the link you receive, which opens `/update-password` once authenticated.
3. Choose your new password and submit the form to complete the reset.

## Continuous Integration

The GitHub Actions workflow automatically runs `npm audit fix`, linting,
unit tests and Playwright end-to-end tests on every push.

## Deployment

Build the production bundle and run it in Docker:
```bash
docker build -t mamastock .
docker run -p 4173:4173 mamastock
```

For Vercel or Netlify, provide environment variables and deploy the `dist` folder created by `npm run build`.

## Reporting

Generate a weekly cost center report with `node scripts/weekly_report.js` which outputs `weekly_cost_centers.xlsx`.

Export monthly invoices for your accounting system using
`node scripts/export_accounting.js 2024-01` which creates
`invoices_YYYY-MM.csv`.

Automatically allocate historic stock movements to cost centers with
`node scripts/reallocate_history.js`. The script analyses past consumption and
creates missing allocations based on historical ratios.

Create JSON backups of core tables using `node scripts/backup_db.js`. The script
exports products, suppliers, supplier product links, invoices, invoice lines,
inventories, inventory lines, tasks and stock movements into a dated file such
as `backup_20250101.json`.

## Gestion de la carte

Les fiches techniques constituent la base de données de production. Un nouvel
écran **Carte** liste uniquement les fiches actives à la vente (`carte_actuelle`)
et permet la mise à jour rapide du prix de vente, du type (nourriture ou
boisson) et du sous-type. Retirer une fiche de la carte ne la supprime pas : le
champ `carte_actuelle` est simplement désactivé. Les politiques RLS s'assurent
que seules les fiches rattachées à la `mama_id` de l'utilisateur sont visibles.

## Menu Engineering

La page **Menu Engineering** analyse la performance des plats à la carte. Les
ventes par fiche sont saisies mensuellement et stockées dans la table
`ventes_fiches_carte`. Pour chaque période, l'application calcule le food cost,
la popularité et attribue un classement automatique (Star, Plow Horse,
Puzzle ou Dog).

## UI Guidelines

This project provides a small design system to keep all screens visually
consistent. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for colour codes,
typography details and component examples. When adding new pages, reuse the
existing button and form classes to match the MamaStock branding. Tailwind
utility classes such as `bg-mamastock-bg` and `text-mamastock-gold` should be
used whenever possible to keep colours consistent.

## FAQ

**Dev server cannot connect to Supabase**

Ensure the `.env` file contains valid Supabase credentials and that you have an active internet connection. Delete `node_modules` and run `npm install` if issues persist.
**Lint or tests fail due to missing packages**

Run `npm install` to ensure dependencies like `vitest`, `@eslint/js` and `playwright` are available before running lint or test commands.
