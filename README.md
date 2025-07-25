# MamaStock
⚠️ Ce logiciel est propriétaire. Toute utilisation, copie ou distribution sans licence commerciale valide est interdite.


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
`npm install` again. This ensures `tesseract.js`, `vitest`, `@eslint/js` and
`playwright` are available before running the commands above.

### Branding & PWA

The interface uses a reusable `MamaLogo` component for consistent branding.
The default router redirects unauthenticated visitors from `/` to `/login` and
shows the dashboard when logged in. `index.html` contains PWA metadata with the
favicon, manifest and splash screen so you can install the app on mobile.

### Liquid glass theme

The UI uses an animated "liquid glass" look across every page. Waves and
bubble particles are rendered behind glass panels and dialogs, with a glow that
follows the mouse on desktop and a ripple effect on mobile. A preview of the
theme can be enabled by appending `?preview` to the URL on the home or login
pages. Colours adapt automatically to light or dark mode through the
`ThemeProvider`.

Background animations accept an optional `intensity` prop so pages can tune
the opacity of the glow. When previewing, you can also append
`&intensity=1.5` (for example) to the URL to increase or decrease the
transparency.

Reusable components `LiquidBackground`, `WavesBackground`, `MouseLight` and
`TouchLight` are available under `src/components/LiquidBackground`. Include
them at the root of a page or layout to display the animated waves, bubble
particles and interactive lights.

Le script `src/registerSW.js` enregistre automatiquement un service worker pour activer l'usage hors ligne. Lancez `npm run preview` ou servez le dossier `dist` pour vérifier que l'enregistrement fonctionne.
### Database

SQL scripts are stored in [`db/full_setup.sql`](./db/full_setup.sql). To initialise a local Supabase instance:

```bash
supabase start
supabase db reset --file db/full_setup.sql
# Optionally switch the schema to French names
supabase db execute < db/rename_to_french.sql
```
`full_setup.sql` is idempotent and bundles the entire schema, policies and
patches (including the `two_factor_auth` table and `access_rights`/`actif`
columns on `utilisateurs`) so you can run it safely multiple times.

Adjust configuration in `supabase/config.toml` as required.

### Environment variables

Copy `.env.example` to `.env` at the project root and adjust the Supabase
credentials. Optionally create a `.env.local` file to override variables on your
machine. For development this repository already includes default values:

```env
PUBLIC_API_KEY=dev_key
VITE_SUPABASE_URL=https://jhpfdeolleprmvtchoxt.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
MAMASTOCK_BASE_URL=https://api.example.com
MAMASTOCK_API_KEY=public_key
MAMASTOCK_TOKEN=supabase_jwt
MAMASTOCK_MAMA_ID=m1
MAMASTOCK_USER_AGENT=MyApp/1.0
MAMASTOCK_RETRY_ATTEMPTS=3
MAMASTOCK_RETRY_DELAY_MS=1000
MAMASTOCK_TIMEOUT_MS=10000
BACKUP_TABLES=produits,fournisseurs,factures,facture_lignes,\
inventaires,inventaire_lignes,fournisseur_produits,taches,\
tache_instances,mouvements_stock
BACKUP_DIR=backups
BACKUP_GZIP=false
BACKUP_PRETTY=false
BACKUP_CONCURRENCY=5
ACCOUNTING_DIR=reports
REPORT_DIR=reports
REALLOCATE_LIMIT=100
ACCOUNTING_FORMAT=csv # csv|xlsx|json
WEEKLY_REPORT_FORMAT=xlsx # csv|xlsx|json
```
`PUBLIC_API_KEY` is used by the Express routes in `src/api/public`. Set it to a strong random string in production to authorize external requests.


These variables are loaded by Vite during development and build.

The `.env` and `.env.local` files are not tracked by Git, so you can safely
replace these defaults with your own credentials for local development. Pour un
déploiement en production, copiez `.env.production.example` vers
`.env.production` puis
renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Ce fichier
`\.env.production` est également ignoré par Git afin de protéger les clés
sensibles.

Scripts Node.js et API reconnaissent aussi les variables d'environnement
`SUPABASE_URL` et `SUPABASE_ANON_KEY`. Utilisez-les si vous disposez déjà de ces
noms dans votre infrastructure, elles sont prises en charge comme alternative
à `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
Pour les scripts nécessitant des privilèges complets, vous pouvez définir
`SUPABASE_SERVICE_ROLE_KEY` qui sera utilisé en priorité à la place de la clé
anonyme.
Le SDK peut également lire l'URL de l'API publique depuis `MAMASTOCK_BASE_URL`
si vous n'indiquez pas `baseUrl` lors de son instanciation. Cette URL doit
commencer par `http` ou `https`, faute de quoi le SDK renvoie une erreur.
`MAMASTOCK_USER_AGENT` permet de définir la valeur par défaut de l'entête
`User-Agent` si vous n'utilisez pas l'option `userAgent` du constructeur.
Il récupère aussi automatiquement `apiKey` et `token` depuis
`MAMASTOCK_API_KEY` et `MAMASTOCK_TOKEN` si ceux-ci sont définis.
`MAMASTOCK_RETRY_ATTEMPTS` et `MAMASTOCK_RETRY_DELAY_MS` permettent de
configurer respectivement le nombre d'essais et le délai initial entre deux
retries lorsque l'API renvoie un statut 429 ou 503. `MAMASTOCK_TIMEOUT_MS`
définit le délai maximum avant qu'une requête soit abandonnée si vous n'utilisez
pas l'option `timeoutMs` du constructeur. Ces trois valeurs doivent être des
entiers positifs, sinon les valeurs par défaut (3 essais, 1000 ms de délai et
10000 ms de timeout) sont utilisées.
Un utilitaire `getSupabaseClient` centralise la création du client Supabase
et combine éventuellement un paramètre passé en ligne de commande avec les
variables d'environnement lorsque l'une des deux valeurs manque.
Le client est mis en cache et réutilisé pour ces identifiants afin d'éviter
de nouvelles connexions inutiles.
Le client Supabase utilisé dans l'application frontend déclenche
désormais une erreur si ces variables sont absentes afin d'éviter des
plantages silencieux.
Pour faciliter le linting côté Node, `src/lib/supabase.js` déclare
l'environnement Node via `/* eslint-env node */`, donnant accès à
`process.env`.
Lorsque la variable `MAMA_ID` est définie, les scripts Node filtrent leurs
opérations sur cet établissement uniquement.
Le fichier d'exemple indique également l'URL du projet Supabase et contient
la clé anonyme fournie
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`. Vérifiez que ces valeurs
correspondent bien à votre projet avant de lancer un déploiement.

## Tests

Invoice OCR features rely on `tesseract.js`, so ensure dependencies are
installed with `npm install` before running tests.

Unit tests run with `vitest`:

```bash
npm test
```
The suite includes Supertest checks for the Express routes in
`src/api/public`. These tests cover API key and Bearer token authentication on
both `/produits` and `/stock`, including scenarios where Supabase returns an
error, credentials are missing or the API key is invalid. Additional tests
validate that the `MamaStockSDK` attaches the correct headers when calling these
endpoints.

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

### MamaStock SDK

The lightweight SDK in `lib/mamastock-sdk` provides helper functions to call the
public API. Instantiate `MamaStockSDK` with your base URL, API key and/or bearer
token and use `getProduits`, `getStock` or `getPromotions` to fetch data. If you omit `baseUrl`,
the SDK falls back to the `MAMASTOCK_BASE_URL` environment variable. It also reads `MAMASTOCK_API_KEY` and `MAMASTOCK_TOKEN` when the corresponding options are missing. You may set `MAMASTOCK_USER_AGENT` to change the default `User-Agent` header. You may also provide a `mamaId` when creating the SDK so it applies to every request by default; otherwise `MAMASTOCK_MAMA_ID` sets the fallback establishment id. The variables `MAMASTOCK_RETRY_ATTEMPTS` and `MAMASTOCK_RETRY_DELAY_MS` let you tune retry behaviour when options are omitted. Both helpers accept an options object to override the `mama_id` and add optional
filters. You can search by name with `search`, filter by `famille` and `actif`,
and control pagination using `page`, `limit`, `sortBy` and `order`. When
authenticating via API key, provide the `mama_id`:

```ts
const sdk = new MamaStockSDK({
  baseUrl: 'https://api',
  apiKey: 'key',
  token: 'supabase_jwt',
  mamaId: 'm1',
});
const produits = await getProduits(sdk, {
  famille: 'dessert',
  search: 'choco',
  actif: true,
  page: 1,
  limit: 50,
  sortBy: 'nom',
});
```

`getStock` follows the same pattern and accepts filters for `since`, `type` and
`zone`. Pagination works with `page` and `limit`, and results can be sorted with
`sortBy` and `order`. These options mirror the Express routes of the public API.
Each helper also accepts an optional third `AbortSignal` argument to cancel the request.

`getPromotions` exposes similar filters:

```ts
import { getPromotions } from '../lib/mamastock-sdk';

const promos = await getPromotions(sdk, {
  search: 'spring',
  actif: true,
  page: 1,
  limit: 20,
  sortBy: 'date_debut',
  order: 'desc',
});
```

`getPromotions` accepts `search`, `actif`, `page`, `limit`, `sortBy` and `order` parameters.

`fetchData` automatically retries when the server responds with a 429 or 503
status. Set `retryAttempts` when creating the SDK to control the maximum
(default `3`). Use `retryDelayMs` to customise the initial wait time in
milliseconds (default `1000`); the delay increases with each retry. Both values
can be overridden per call by passing them as the third and fourth arguments to
`fetchData`. This helps scripts handle temporary rate limits gracefully.
Provide a custom `fetch` function to the constructor if the global
implementation is missing or you need instrumented requests for testing. Set
`timeoutMs` when creating the SDK or as the fifth argument to `fetchData` to
abort requests that take too long (default `10000` milliseconds). The optional
sixth argument accepts an `AbortSignal` so you can cancel a request manually.
`MAMASTOCK_TIMEOUT_MS` provides the default timeout when the option is omitted.
Use `userAgent` to override the `User-Agent` header sent with each request
(default `"MamaStockSDK"`).

Call `sdk.updateOptions()` at any time to modify these settings dynamically.
Use `sdk.clearAuth()` to remove the stored API key and token.
Use `sdk.setAuth()` to replace the API key or token later on.
Call `sdk.setHeaders()` to add custom headers sent with every request.
Call `sdk.removeHeaders()` to delete previously added headers.

For more examples and authentication details, see [docs/sdk_usage.md](docs/sdk_usage.md).
Simple login helpers are documented in [docs/auth_helpers.md](docs/auth_helpers.md).
Notification utilities are covered in [docs/notifications.md](docs/notifications.md).
Storage helpers are described in [docs/storage_helpers.md](docs/storage_helpers.md).
Menu helpers are described in [docs/menus.md](docs/menus.md).
Autocomplete hooks are described in [docs/autocomplete_hooks.md](docs/autocomplete_hooks.md).
The advanced inventory process is explained in [docs/inventaire_avance.md](docs/inventaire_avance.md).
The Feedback module is documented in [docs/feedback.md](docs/feedback.md).
Quick usage example:

```js
import { useFeedback } from "@/hooks/useFeedback";

const { addFeedback } = useFeedback();

addFeedback({ module: "Inventaire", message: "Erreur interface", urgence: "elevee" });
```
The e-invoice import feature is described in [docs/import_factures.md](docs/import_factures.md).
Requisition helpers are described in [docs/requisitions.md](docs/requisitions.md).
Task management is documented in [docs/taches.md](docs/taches.md).

## Features
- Dashboard overview at `/dashboard` (root `/` redirects here) with KPI widgets,
  stock alerts and trend charts
- Comparatif des prix fournisseurs avec moyenne et dernier achat // ✅ Correction Codex
- Comparison page available at `/fournisseurs/comparatif` and linked from the sidebar
- Upload, delete, download or replace files via Supabase Storage using `useStorage`; `replaceFile` handles cleanup of previous uploads
- Daily menu handling provided by `useMenuDuJour`
- Simple auth helpers `login()`, `signUp()`, `resetPassword()`,
  `updateEmail()`, `updatePassword()`, `updateProfile()`, `sendMagicLink()`,
  `loginWithProvider()`, `sendPhoneOtp()`, `verifyOtp()`, `getCurrentUser()`,
  `getSession()`, `refreshSession()`, `onAuthStateChange()`,
  `getAccessToken()`, `enableTwoFa()`, `disableTwoFa()`,
  `resendEmailVerification()` and `logout()`
- Menu planning with recipe associations, production planning and automatic stock decrement
- Forecast planning page `/planning` to record upcoming needs with notes
  (see [docs/planning_previsionnel.md](docs/planning_previsionnel.md))
- Electronic invoice import page `/factures/import` for JSON or UBL files
  (see [docs/import_factures.md](docs/import_factures.md))
- Menus can be imported or exported via Excel (the importer falls back to the first sheet if no "Menus" sheet is present)
- Realtime updates available via `subscribeToMenus()`
- PDF export for invoices and fiches techniques using jsPDF
  - Accepts an optional `orientation` setting for portrait or landscape layouts
  - CSV export supports custom `delimiter` and `quoteValues` options
  - Fiche form lets you combine products and sub-recipes with autocomplete helpers
  - TSV export via `exportToTSV`
  - XML export via `exportToXML`
  - HTML export via `exportToHTML`
  - JSON export with optional pretty formatting
  - YAML export via `exportToYAML`
  - Markdown export via `exportToMarkdown`
  - TXT export via `exportToTXT`
  - Clipboard export via `exportToClipboard`
  - `useExport` hook handles TSV, JSON, XML, HTML, Markdown, YAML, TXT and clipboard formats
  - All exports support `includeWatermark: false` to remove the footer
- Forms display links to preview uploaded documents immediately
- Product management supports codes, allergens and photo upload
- Products track a minimum stock level for dashboard alerts
- Product list features pagination, sortable columns, filters, quick duplication of existing entries and Excel import/export (the importer reads the first sheet if no "Produits" sheet is found)
- Manage products from `/produits` with creation and detail pages at
  `/produits/nouveau` and `/produits/:id`
- Chaque produit enregistre les prix fournisseurs et met automatiquement a jour son PMP // ✅ Correction Codex
- Stock and movement history available from the product detail modal
- La liste des fournisseurs est exportable en Excel/PDF et met en avant les fournisseurs inactifs // ✅ Correction Codex
- Alertes pour les fournisseurs sans facture depuis 6 mois // ✅ Correction Codex
- Stock detail charts show monthly product rotation
- Stock movement management available at `/mouvements`
- Indexes on `mouvements_stock.type`, `zone`, `sous_type` and `motif` speed up filtering
- Public stock API supports filters on `type`, `zone`, pagination and sorting
- Public promotions API supports `search`, `actif`, pagination and sorting
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
- Advanced inventory form filters products by zone and family, calculates consumption and requisitions with Excel export in the detail view
- Requisitions module lets teams declare needs without impacting real stock and export them to Excel
- Storage zones can be managed from the settings with activation toggles and pagination; products use an autocomplete field listing active zones
- Inventory integrity can be verified with the `validateInventaireStock` helper which compares product stock after closing an inventory
- Stock statistics page `/stats/stocks` uses the `dashboard_stats` RPC and offers Excel export from the sidebar
- Task management available at `/taches` with creation and list pages
- Tasks support manual or delayed due dates, priorities and recurring schedules
- Invoice form supports OCR scanning of uploaded documents
- Manage invoices from `/factures` with pages `/factures/nouveau` and `/factures/:id`
- Index on `factures.reference` speeds up invoice search queries
- Columns `total_ht`, `total_tva` and `total_ttc` are computed automatically via triggers
- Index on `products.code` speeds up lookups by internal product code
- Index sur `fournisseurs.nom` pour accélérer les recherches fournisseur // ✅ Correction Codex
- RLS policies on `produits`, `fournisseur_produits` and `fournisseurs` rely on `current_user_mama_id()` for isolation
- Le formulaire fournisseur enregistre un nom de contact et une adresse email. Les listes de fournisseurs, // ✅ Correction Codex
  PDF exports and Excel exports all include the columns `ville`, `tel`, `email`
  and `contact` for coherence with `db/TABLE.txt`.
- Obsolete admin dashboards `StatsDashboard` and `AuditViewer` were removed as
  they were no longer routed anywhere.
- Automatic audit triggers log cost center changes and allocations
- Cost center allocation modal offers suggestions based on historical data
- SQL function `suggest_cost_centers` is granted to authenticated users for these recommendations
- SQL function `stats_cost_centers` can be executed by any authenticated user for cost center analytics
- Dashboard analytics functions `dashboard_stats`, `top_produits` and `mouvements_without_alloc` are also executable by authenticated users
- Command `npm run allocate:history` applies those suggestions to past movements
- Barre de recherche globale pour trouver rapidement produits ou fournisseurs // ✅ Correction Codex
- Recherche instantanee sur documents, alertes et listes de fournisseurs avec filtrage serveur // ✅ Correction Codex
- Des hooks d'autocompletion facilitent la selection des fournisseurs et des factures en toute securite // ✅ Correction Codex
- Notifications hook provides `markAllAsRead()`, `fetchUnreadCount()`, `updateNotification()`, `deleteNotification()` and `subscribeToNotifications()` helpers
- Feedback page `/feedback` lets users send comments with urgency level (see [docs/feedback.md](docs/feedback.md))
- La configuration API fournisseur est disponible a /parametrage/api-fournisseurs (see [docs/fournisseurs_api_config.md](docs/fournisseurs_api_config.md)) // ✅ Correction Codex
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

For Vercel or Netlify, provide environment variables and deploy the `dist` folder created by `npm run build`. Une commande `npm run deploy` est
prête à utiliser avec Netlify (nécessite `netlify-cli`).

### Deployment checklist

1. Copiez `.env.production.example` vers `.env.production` et vérifiez les valeurs `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
2. Exécutez `npm install && npm run lint && npm test` pour s'assurer que l'environnement est sain.
3. Lancez `npm run build` puis `npm run preview` afin de vérifier le bundle généré.
4. Une fois le rendu validé, déployez avec `npm run deploy`.
5. Les politiques RLS sont intégrées dans `db/full_setup.sql`. Réexécutez ce script en cas de besoin.

## Reporting

Generate a weekly cost center report with `node scripts/weekly_report.js` which outputs `weekly_cost_centers.xlsx` by default.
Set `MAMA_ID`, pass it as the second argument or use `--mama-id ID` to restrict the report to a specific establishment. You may also provide Supabase credentials as additional arguments (`[SUPABASE_URL] [SUPABASE_KEY]`) or via `--url URL --key KEY` flags.
The script also accepts `--start YYYY-MM-DD`, `--end YYYY-MM-DD`, `--output FILE` and `--format csv|xlsx|json` to customize the date range, output file and format. Any other value is ignored. You can also set `WEEKLY_REPORT_FORMAT` to choose the default format when the flag is omitted. When no output file is provided the report is written inside `REPORT_DIR` if that variable is set. The directory is created automatically when missing.

Export monthly invoices for your accounting system using
`node scripts/export_accounting.js 2024-01 [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY]` which creates
`invoices_YYYY-MM.csv` by default. Add `--format xlsx` or `--format json` to change the format and `--output FILE` to change the name. Invalid values are ignored. Provide the establishment id via the second argument or `--mama-id ID`. Supabase credentials can be passed as `[SUPABASE_URL] [SUPABASE_KEY]` or using `--url URL --key KEY`. Set `ACCOUNTING_FORMAT` to override the default format when `--format` is not supplied. If no output file is given, the export is created inside `ACCOUNTING_DIR` when defined. The folder is created automatically if necessary.

Use `--help` or `-h` anywhere in the command to display a usage summary.
Use `--version` or `-v` to print the current package version.
Use `--env-file <file>` or `-e <file>` to load environment variables from a file before running the script.
If no option is provided, the helper automatically loads `.env` and then `.env.local` from the current directory when present.
You may also define `ENV_FILE` to load variables from a specific file before these defaults.
If no files are found in the current directory, the helper looks in the script's own directory.
All scripts rely on helpers from `scripts/cli_utils.js`. `runScript` handles help and version flags while `loadEnvFile(path)` loads variables from a `.env` style file, supporting lines like `export NAME="value"` or `NAME='value #text'`.  Comments after unquoted values are ignored and values may reference other variables such as `$HOME` or `${HOME}`.  Other helpers include `parseOutputFlag` for `--output`/`-o`, `parseDateRangeFlags` for `--start`/`--end`, `parseDryRunFlag` for `--dry-run`/`-d`, `parseLimitFlag` for `--limit`/`-l` (positive integers only),  `parseTablesFlag` for `--tables`/`-t` (deduplicates names), `parseGzipFlag` for `--gzip`/`-z`, `parsePrettyFlag` for `--pretty`/`-p`, `parseConcurrencyFlag` for `--concurrency`/`-c`, `parseMamaIdFlag` for `--mama-id`/`-m`, `parseFormatFlag` for `--format`/`-f` and `parseSupabaseFlags` for `--url`/`-u` and `--key`/`-k`. Scripts only execute their main logic when `isMainModule` detects they were run directly. Flags that take a value also support `--name=value` and `-n=value`.

Automatically allocate historic stock movements to cost centers with
`node scripts/reallocate_history.js [LIMIT] [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--limit N] [--dry-run] [--url URL --key KEY]`. The optional `LIMIT`
controls how many movements are processed, defaulting to `100`. You can also pass `--limit` or `-l` instead of the positional value. When `MAMA_ID`
is provided (or set via the environment variable of the same name) only
movements for that establishment are allocated. You may also use `--mama-id ID` to pass it as a flag. Supabase credentials may be supplied positionally or via `--url` and `--key`.
Add `--dry-run` or `-d` to preview the allocations without writing any changes.
The script analyses past consumption and creates missing allocations based on historical ratios.
You can also set `REALLOCATE_LIMIT` to override the default limit when neither
the positional argument nor `--limit` is provided. The value must be a positive
integer; invalid values are ignored and the default of `100` is used instead.

Create JSON backups of core tables using `node scripts/backup_db.js [FILE] [MAMA_ID] [SUPABASE_URL] [SUPABASE_KEY] [--tables list] [--output FILE] [--gzip] [--url URL --key KEY]`. The script
exporte les produits, fournisseurs, liaisons produit-fournisseur, factures, lignes de facture, // ✅ Correction Codex
inventories, inventory lines, tasks and stock movements into a dated file such
as `backup_20250101.json`. Pass `--output` or `-o` to choose the destination file. Provide the `MAMA_ID` as the second argument or with `--mama-id ID`.
Use `--tables` (or `-t`) with a comma-separated list to export only certain tables. Duplicate names in the list are ignored.
You can also set `BACKUP_TABLES` to change the default table list when the flag is omitted. Set `BACKUP_GZIP` to true or pass `--gzip` to compress the output as `backup.json.gz`.
Use `--pretty` or `BACKUP_PRETTY=true` to indent the JSON instead of minifying it.
Tables are fetched concurrently for faster exports.
Set `BACKUP_CONCURRENCY` or pass `--concurrency N` to limit how many tables are fetched in parallel. `N` must be a positive integer; other values disable the limit.
When no output file is provided, the backup is written to the directory specified by `BACKUP_DIR` if set, otherwise in the current directory. The directory will be created when it doesn't exist.
Credentials passed on the command line override the environment, whether supplied positionally or via `--url` and `--key`.

## Gestion de la carte

Les fiches techniques constituent la base de données de production. Un nouvel
écran **Carte** liste uniquement les fiches actives à la vente (`carte_actuelle`)
et permet la mise à jour rapide du prix de vente, du type (nourriture ou
boisson) et du sous-type. Retirer une fiche de la carte ne la supprime pas : le
champ `carte_actuelle` est simplement désactivé. Les politiques RLS s'assurent
que seules les fiches rattachées à la `mama_id` de l'utilisateur sont visibles.

## Menu Engineering

Pour plus de details, voir [docs/menu_engineering.md](docs/menu_engineering.md).

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

**"permission denied for table utilisateurs" after login**

Ensure the database schema is up to date by reapplying `db/full_setup.sql`:

```bash
supabase db reset --file db/full_setup.sql
```
This recreates RLS policies and grants on `utilisateurs` so authenticated requests succeed.

The file [`db/full_setup.sql`](./db/full_setup.sql) now adds the `actif` column
on every table using simple `ALTER TABLE` statements. Reapply it if you still
see `column "actif" does not exist` errors.

After resetting the schema, verify the frontend still builds and tests pass:

```bash
npm run lint
npm test
npm run build && npm run preview
```

## Module Promotions

Un nouvel écran permet de gérer les promotions et opérations commerciales (route `/promotions`).
Les promotions possèdent un nom, une période de validité et un indicateur d'activation.
Le stockage est assuré via les tables `promotions` et `promotion_products` définies dans
`db/full_setup.sql`.

## Module Consolidation multi-sites

Cette fonctionnalité permet d'obtenir un tableau de bord global sur plusieurs établissements.
La page `/stats/consolidation` affiche pour chaque `mama` le stock valorisé, la consommation du mois
et le nombre de mouvements enregistrés. Les utilisateurs non `superadmin` ne voient que
leur établissement grâce à la fonction SQL `consolidated_stats` filtrée par `mama_id`.

SQL associé dans `db/full_setup.sql` :
- Vue `v_consolidated_stats` regroupant les indicateurs par `mama`
- Fonction `consolidated_stats()` avec filtrage selon le rôle

Les droits `SELECT` et `EXECUTE` sont accordés au rôle `authenticated`.

## Module Audit avancé

Ce module conserve une trace détaillée de toutes les modifications
sur les tables sensibles (produits, factures…).
La page `/audit-trail` permet de filtrer par table et période
et d'afficher les valeurs avant et après modification.

SQL associé dans `db/full_setup.sql` :
- Table `audit_entries` avec politiques RLS filtrées par `mama_id`
- Fonction `add_audit_entry()` et triggers sur `products` et `factures`

Le rôle `authenticated` dispose du droit `SELECT` et peut exécuter la fonction.

## Module Planning prévisionnel

Cette page `/planning` permet de préparer les commandes ou besoins à venir.
Chaque entrée comporte une date prévue et des notes libres.

Pour plus de détails, voir [docs/planning_previsionnel.md](docs/planning_previsionnel.md).

SQL associé dans `db/full_setup.sql` :
- Table `planning_previsionnel` stockant les plannings par `mama`
- Politique RLS filtrée par `mama_id`
- Trigger d'audit `trg_audit_planning`

Les utilisateurs disposant du droit `planning` peuvent consulter et modifier ces données.

## Module Alertes avancées

Ce module permet de configurer des règles de seuil sur les produits afin d'être notifié automatiquement lorsque le stock passe sous la limite définie. La page `/alertes` liste les règles existantes et permet d'en créer de nouvelles. Chaque alerte déclenchée est enregistrée pour consultation.

SQL associé dans `db/full_setup.sql` :
- Table `alert_rules` pour les paramètres des seuils
- Table `alert_logs` historisant chaque notification
- Fonction `check_stock_alert()` déclenchée par un trigger sur `products`

Les droits `SELECT/INSERT/UPDATE/DELETE` sont accordés au rôle `authenticated` sur `alert_rules`. `alert_logs` est en lecture seule pour ce rôle.
## Module Import e-factures

Cette fonctionnalité facilite l'import des factures fournisseurs au format électronique (JSON ou UBL). La page `/factures/import` permet de téléverser un fichier qui sera analysé puis converti en facture et lignes de facture.

SQL associé dans `db/full_setup.sql` :
- Table `incoming_invoices` stockant les fichiers bruts à traiter
- Fonction `import_invoice(payload jsonb)` créant les enregistrements dans `factures` et `facture_lignes`

Le rôle `authenticated` dispose du droit `INSERT` sur `incoming_invoices` et peut exécuter la fonction pour automatiser la saisie.

## Module Gestion documentaire

Ce module permet de centraliser les documents importants de chaque établissement (procédures internes, contrats, fiches techniques…). La page `/documents` affiche la liste des fichiers enregistrés et permet d'en ajouter ou d'en supprimer. Chaque document possède un titre, une URL de stockage et est lié à un `mama`.

SQL associé dans `db/full_setup.sql` :
- Table `documents` avec `title` et `file_url`
- Policies RLS filtrées par `mama_id`
- Droits `SELECT/INSERT/UPDATE/DELETE` pour le rôle `authenticated`.

## Module Validation des actions

Certaines opérations sensibles nécessitent une validation par un responsable.
La page `/validations` liste les demandes en attente et permet aux rôles
`admin` ou `superadmin` de les approuver ou les refuser.
Pour en savoir plus, consultez [docs/validation_requests.md](docs/validation_requests.md).

SQL associé dans `db/full_setup.sql` :
- Table `validation_requests` enregistrant l'action à valider
- Fonction `current_user_role()` pour vérifier le rôle courant
- Policies RLS filtrées par `mama_id`; les mises à jour ne sont possibles que
  pour les rôles autorisés
- Droits `SELECT/INSERT/UPDATE/DELETE` pour le rôle `authenticated`.

## Module Factures et bons de livraison

Ce module unique gère à la fois les factures fournisseur et les bons de
livraison. Un sélecteur dans le formulaire permet de choisir le mode "Bon de
livraison" ou "Facture". La case "Mettre à jour le stock maintenant" détermine
si les produits sont ajoutés immédiatement au stock. Les factures peuvent être
créées manuellement ou à partir de bons de livraison existants. La liste est
paginée et indique si le stock a déjà été impacté. Un bouton "Ajouter au stock"
s'affiche pour les enregistrements créés sans mise à jour immédiate.

## Module API fournisseurs

Ce module gère les paramètres de connexion aux API des fournisseurs
(`fournisseurs_api_config`). Chaque configuration est liée à un fournisseur et à
un `mama`. Les données sont protégées par RLS et les index sur
`fournisseur_id` et `mama_id` accélèrent les requêtes. Le hook React
`useFournisseurApiConfig` permet de charger, enregistrer, lister ou supprimer ces
configurations depuis l'interface. Le hook `useFournisseurAPI` expose quant à lui
`importFacturesFournisseur`, `syncCatalogue`, `envoyerCommande`, `getCommandeStatus`,
`cancelCommande` et `testConnection` pour interagir avec les services externes.
La page `/parametrage/api-fournisseurs` liste ces configurations et permet d'accéder au formulaire d'édition pour chaque fournisseur.

## Module Analytique avancée

La page `/stats/advanced` affiche des graphiques d'évolution mensuelle des achats
par établissement. Les données sont fournies par la vue `v_monthly_purchases`
et la fonction `advanced_stats()` filtrée par `mama_id`.

SQL associé dans `db/full_setup.sql` :
- Vue `v_monthly_purchases` résumant les totaux mensuels de factures
- Fonction `advanced_stats(start_date date, end_date date)` retournant les
  chiffres de l'établissement courant

Le rôle `authenticated` dispose du droit `SELECT` sur la vue et peut exécuter la
fonction.

## Module Onboarding interactif

Un tutoriel guidé s'affiche lors de la première connexion afin d'accompagner
l'utilisateur. La table `onboarding_progress` conserve la dernière étape validée
par chaque utilisateur.

SQL associé dans `db/full_setup.sql` :
- Table `onboarding_progress` avec `user_id`, `mama_id` et `step`
- Policies RLS limitant l'accès à l'utilisateur courant
- Droits `SELECT/INSERT/UPDATE` pour le rôle `authenticated`.

## Optimisation mobile et tactile

Pour une meilleure utilisation sur smartphones, l'application propose un menu
latéral accessible par un bouton "hamburger" et par glissement du bord de
l'écran. Le hook `useSwipe` gère les gestes tactiles pour ouvrir ou fermer le
menu. Sur grand écran le comportement reste inchangé.

```jsx
import { useSwipe } from '@/hooks/useSwipe';
```

Cette optimisation améliore la navigation sur tablettes et mobiles tout en
restant compatible desktop.

## Module Aide contextuelle

Ce module fournit une page d'aide et FAQ consultable depuis la barre latérale. Les articles sont filtrés par `mama_id` pour s'adapter à chaque établissement.

SQL associé dans `db/full_setup.sql` :
- Table `help_articles` stockant `title`, `content` et `mama_id`
- Policies RLS restreignant l'accès à l'établissement courant
- Droits `SELECT/INSERT/UPDATE/DELETE` pour le rôle `authenticated`

Toutes les nouvelles fonctionnalités reposent sur des policies RLS filtrées par `mama_id`, garantissant une séparation stricte des données entre établissements.
