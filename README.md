# MamaStock

MamaStock is a stock and cost management application built with React and
Supabase. The toolchain relies on modern ESM modules and requires **Node.js
18+** (see `package.json` engines field).

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
- Dashboard overview with KPI widgets, stock alerts and trend charts. The widgets now show invoice and supplier counts
- Supplier price comparison with average and latest purchase metrics
- Comparison page available at `/fournisseurs/comparatif` and linked from the sidebar
- Upload and delete files via Supabase Storage using `useStorage`, with automatic cleanup of replaced uploads
- Daily menu handling provided by `useMenuDuJour`
- Menu planning with recipe associations, production planning and automatic stock decrement
- PDF export for invoices and fiches techniques using jsPDF
- Forms display links to preview uploaded documents immediately
- Product management supports codes, allergens and photo upload
- Products track a minimum stock level for dashboard alerts
- Product list features pagination, sortable columns, filters, quick
  duplication of existing entries and Excel import/export (the importer reads
  the first sheet if no "Produits" sheet is found)
- Each product records supplier prices and automatically updates its PMP
- Stock and movement history available from the product detail modal
- Supplier list supports Excel/PDF export and highlights inactive suppliers
- Alerts for suppliers with no invoices in the last 6 months
- Stock detail charts show monthly product rotation
- Audit log viewer with date and text filters plus Excel export, accessible from the sidebar
- Cost center management with allocation modal and dedicated settings page
- Cost centers can be imported or exported via Excel in the settings page (the importer falls back to the first sheet if no "CostCenters" sheet is present)
- Cost center analytics page summarising allocations by value and quantity with date range filters and graceful error handling (tested for RPC errors)
- Analytics tables can be exported to Excel for further reporting
- Supplier statistics page summarises total purchases and invoice counts
- Loss management page to record wastage, breakage and donations with cost center tracking
- Monthly cost center pivot with columns per month for trend analysis
- Dashboard chart showing monthly purchase price trends per product
- Dashboard pie chart highlights top consumed products over the last month
- Invoice form supports OCR scanning of uploaded documents
- Automatic audit triggers log cost center changes and allocations
- Cost center allocation modal offers suggestions based on historical data
- Dedicated page lists unallocated movements for quick cost center allocation
- Command `npm run allocate:history` applies those suggestions to past movements
- Global search bar in the navbar to quickly find products or suppliers
- Built-in dark mode toggle for better accessibility
- Optional two-factor authentication (TOTP) for user accounts, verified via QR code before activation
- Multi-site support with per-site cost centers and data isolation
- Installable PWA with offline support

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
exports products, suppliers, invoices and stock movements into a dated file such
as `backup_20250101.json`.




## FAQ

**Dev server cannot connect to Supabase**

Ensure the `.env` file contains valid Supabase credentials and that you have an active internet connection. Delete `node_modules` and run `npm install` if issues persist.
**Lint or tests fail due to missing packages**

Run `npm install` to ensure dependencies like `vitest`, `@eslint/js` and `playwright` are available before running lint or test commands.
