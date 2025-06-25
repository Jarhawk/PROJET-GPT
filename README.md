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
`npm install` again. This ensures `tesseract.js`, `vitest`, `@eslint/js` and
`playwright` are available before running the commands above.

### Branding & PWA

The interface uses a reusable `MamaLogo` component for consistent branding.
The default router redirects unauthenticated visitors from `/` to `/login` and
shows the dashboard when logged in. `index.html` contains PWA metadata with the
favicon, manifest and splash screen so you can install the app on mobile.

Le script `src/registerSW.js` enregistre automatiquement un service worker pour activer l'usage hors ligne. Lancez `npm run preview` ou servez le dossier `dist` pour vérifier que l'enregistrement fonctionne.
### Database

SQL scripts are stored in [`sql/`](./sql). To initialise a local Supabase instance:

```bash
supabase start
supabase db reset --file sql/full_setup.sql --seed sql/seed.sql
```
The standalone scripts `init.sql`, `rls.sql` and `mama_stock_patch.sql` remain
available if you prefer running them individually. The combined
`full_setup.sql` is idempotent and includes the full schema, policies and
patches so you can run it safely multiple times.

Adjust configuration in `supabase/config.toml` as required.

### Environment variables

Copy `.env.example` to `.env` at the project root and adjust the Supabase
credentials. For development this repository already includes default values:

```env
PUBLIC_API_KEY=dev_key
VITE_SUPABASE_URL=https://jhpfdeolleprmvtchoxt.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```
`PUBLIC_API_KEY` is used by the Express routes in `src/api/public`. Set it to a strong random string in production to authorize external requests.


These variables are loaded by Vite during development and build.

The `.env` file is not tracked by Git, so you can safely replace these
defaults with your own credentials for local development. Pour un déploiement
en production, copiez `.env.production.example` vers `.env.production` puis
renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Ce fichier
`\.env.production` est également ignoré par Git afin de protéger les clés
sensibles.
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
- Live search on documents, alerts and suppliers lists with server-side filtering
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

For Vercel or Netlify, provide environment variables and deploy the `dist` folder created by `npm run build`. Une commande `npm run deploy` est
prête à utiliser avec Netlify (nécessite `netlify-cli`).

### Deployment checklist

1. Copiez `.env.production.example` vers `.env.production` et vérifiez les valeurs `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
2. Exécutez `npm install && npm run lint && npm test` pour s'assurer que l'environnement est sain.
3. Lancez `npm run build` puis `npm run preview` afin de vérifier le bundle généré.
4. Une fois le rendu validé, déployez avec `npm run deploy`.
5. Appliquez les politiques RLS en exécutant `psql -f sql/rls.sql` si nécessaire.

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

## Module Promotions

Un nouvel écran permet de gérer les promotions et opérations commerciales (route `/promotions`).
Les promotions possèdent un nom, une période de validité et un indicateur d'activation.
Le stockage est assuré via les tables `promotions` et `promotion_products` définies dans
`sql/mama_stock_patch.sql`.

## Module Consolidation multi-sites

Cette fonctionnalité permet d'obtenir un tableau de bord global sur plusieurs établissements.
La page `/stats/consolidation` affiche pour chaque `mama` le stock valorisé, la consommation du mois
et le nombre de mouvements enregistrés. Les utilisateurs non `superadmin` ne voient que
leur établissement grâce à la fonction SQL `consolidated_stats` filtrée par `mama_id`.

SQL associé dans `sql/mama_stock_patch.sql` :
- Vue `v_consolidated_stats` regroupant les indicateurs par `mama`
- Fonction `consolidated_stats()` avec filtrage selon le rôle

Les droits `SELECT` et `EXECUTE` sont accordés au rôle `authenticated`.

## Module Audit avancé

Ce module conserve une trace détaillée de toutes les modifications
sur les tables sensibles (produits, factures…).
La page `/audit-trail` permet de filtrer par table et période
et d'afficher les valeurs avant et après modification.

SQL associé dans `sql/mama_stock_patch.sql` :
- Table `audit_entries` avec politiques RLS filtrées par `mama_id`
- Fonction `add_audit_entry()` et triggers sur `products` et `factures`

Le rôle `authenticated` dispose du droit `SELECT` et peut exécuter la fonction.

## Module Planning prévisionnel

Cette page `/planning` permet de préparer les commandes ou besoins à venir.
Chaque entrée comporte une date prévue et des notes libres.

SQL associé dans `sql/mama_stock_patch.sql` :
- Table `planning_previsionnel` stockant les plannings par `mama`
- Politique RLS filtrée par `mama_id`
- Trigger d'audit `trg_audit_planning`

Les utilisateurs disposant du droit `planning` peuvent consulter et modifier ces données.

## Module Alertes avancées

Ce module permet de configurer des règles de seuil sur les produits afin d'être notifié automatiquement lorsque le stock passe sous la limite définie. La page `/alertes` liste les règles existantes et permet d'en créer de nouvelles. Chaque alerte déclenchée est enregistrée pour consultation.

SQL associé dans `sql/mama_stock_patch.sql` :
- Table `alert_rules` pour les paramètres des seuils
- Table `alert_logs` historisant chaque notification
- Fonction `check_stock_alert()` déclenchée par un trigger sur `products`

Les droits `SELECT/INSERT/UPDATE/DELETE` sont accordés au rôle `authenticated` sur `alert_rules`. `alert_logs` est en lecture seule pour ce rôle.
## Module Import e-factures

Cette fonctionnalité facilite l'import des factures fournisseurs au format électronique (JSON ou UBL). La page `/factures/import` permet de téléverser un fichier qui sera analysé puis converti en facture et lignes de facture.

SQL associé dans `sql/mama_stock_patch.sql` :
- Table `incoming_invoices` stockant les fichiers bruts à traiter
- Fonction `import_invoice(payload jsonb)` créant les enregistrements dans `factures` et `facture_lignes`

Le rôle `authenticated` dispose du droit `INSERT` sur `incoming_invoices` et peut exécuter la fonction pour automatiser la saisie.

## Module Gestion documentaire

Ce module permet de centraliser les documents importants de chaque établissement (procédures internes, contrats, fiches techniques…). La page `/documents` affiche la liste des fichiers enregistrés et permet d'en ajouter ou d'en supprimer. Chaque document possède un titre, une URL de stockage et est lié à un `mama`.

SQL associé dans `sql/mama_stock_patch.sql` :
- Table `documents` avec `title` et `file_url`
- Policies RLS filtrées par `mama_id`
- Droits `SELECT/INSERT/UPDATE/DELETE` pour le rôle `authenticated`.

## Module Validation des actions

Certaines opérations sensibles nécessitent une validation par un responsable.
La page `/validations` liste les demandes en attente et permet aux rôles
`admin` ou `superadmin` de les approuver ou les refuser.

SQL associé dans `sql/mama_stock_patch.sql` :
- Table `validation_requests` enregistrant l'action à valider
- Fonction `current_user_role()` pour vérifier le rôle courant
- Policies RLS filtrées par `mama_id`; les mises à jour ne sont possibles que
  pour les rôles autorisés
- Droits `SELECT/INSERT/UPDATE/DELETE` pour le rôle `authenticated`.

## Module Analytique avancée

La page `/stats/advanced` affiche des graphiques d'évolution mensuelle des achats
par établissement. Les données sont fournies par la vue `v_monthly_purchases`
et la fonction `advanced_stats()` filtrée par `mama_id`.

SQL associé dans `sql/mama_stock_patch.sql` :
- Vue `v_monthly_purchases` résumant les totaux mensuels de factures
- Fonction `advanced_stats(start_date date, end_date date)` retournant les
  chiffres de l'établissement courant

Le rôle `authenticated` dispose du droit `SELECT` sur la vue et peut exécuter la
fonction.

## Module Onboarding interactif

Un tutoriel guidé s'affiche lors de la première connexion afin d'accompagner
l'utilisateur. La table `onboarding_progress` conserve la dernière étape validée
par chaque utilisateur.

SQL associé dans `sql/mama_stock_patch.sql` :
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

SQL associé dans `sql/mama_stock_patch.sql` :
- Table `help_articles` stockant `title`, `content` et `mama_id`
- Policies RLS restreignant l'accès à l'établissement courant
- Droits `SELECT/INSERT/UPDATE/DELETE` pour le rôle `authenticated`

Toutes les nouvelles fonctionnalités reposent sur des policies RLS filtrées par `mama_id`, garantissant une séparation stricte des données entre établissements.
