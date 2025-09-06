# Front Snapshot — 2025-09-04

- Node: v22.19.0
- npm: 11.4.2
- Exports: Documents/MamaStock/Exports (configurable)

## package.json
Name: mamastock.com
Version: 0.0.0

Scripts:
  allocate:history: node scripts/reallocate_history.js
  audit: node scripts/audit-project.mjs
  audit:fix: node scripts/fix-project.mjs
  backup: node scripts/backup_db.js
  build: vite build
  check:schema: node scripts/checkSchema.js
  deploy: npm run build && npx netlify deploy --dir=dist --prod
  dev: vite
  export:accounting: node scripts/export_accounting.js
  fix:fe: node scripts/fixFrontend.js
  fix:fe:write: node scripts/fixFrontend.js --write
  fix:imports: node scripts/fixLegacyMouvements.js
  front:sql:gaps: node scripts/checkFrontVsSQL.mjs
  install:browsers: playwright install
  lint: eslint . --ext .js,.jsx,.ts,.tsx
  lint:fix: eslint "src/**/*.{js,jsx,ts,tsx}" --fix && prettier --write "src/**/*.{js,jsx,ts,tsx,json,md,css}"
  preview: vite preview
  report: node scripts/weekly_report.js
  sanitize:src: node scripts/sanitize-source.js
  schema:analyze: node scripts/analyzeFrontBackend.js
  schema:fix-fk: node scripts/fixForeignKeys.js
  schema:normalize: node scripts/normalizeSchema.js
  schema:repair: node scripts/repairSchema.js
  schema:repair:apply: SCHEMA_APPLY=1 node scripts/repairSchema.js
  schema:smoke: node scripts/smokeSchema.mjs
  test: vitest
  test:e2e: playwright test
  test:manifest: node scripts/validate_manifest_icons.cjs
  test:ui: vitest --ui
  typecheck: tsc --noEmit

Dependencies:
  @radix-ui/react-dialog: ^1.1.15
  @radix-ui/react-dropdown-menu: ^2.1.15
  @radix-ui/react-select: ^2.2.6
  @react-pdf/renderer: 3.4.5
  @supabase/supabase-js: ^2.55.0
  @tailwindcss/cli: ^4.1.7
  @tailwindcss/vite: ^4.1.7
  @tanstack/react-query: ^5.85.5
  @tanstack/react-virtual: ^3.13.12
  date-fns: 3.6.0
  express: ^5.1.0
  file-saver: ^2.0.5
  framer-motion: ^12.19.1
  html2canvas: ^1.4.1
  i18next: ^25.2.1
  js-yaml: ^4.1.0
  jspdf: ^3.0.1
  jspdf-autotable: ^5.0.2
  lucide-react: ^0.511.0
  nprogress: ^0.2.0
  otplib: ^12.0.1
  pg: ^8.11.3
  qrcode.react: ^4.2.0
  react: 18.3.1
  react-dom: 18.3.1
  react-hook-form: ^7.62.0
  react-hot-toast: ^2.5.2
  react-i18next: ^15.5.3
  react-router-dom: ^7.6.2
  react-to-print: ^3.1.0
  react-toastify: ^11.0.5
  recharts: ^2.15.4
  sonner: ^2.0.7
  tesseract.js: ^6.0.1
  uuid: ^11.1.0
  xlsx: ^0.18.5
  zod: 3.23.8

DevDependencies:
  @babel/parser: ^7.28.0
  @babel/traverse: ^7.28.0
  @eslint/js: 8.57.0
  @playwright/test: ^1.54.1
  @tailwindcss/postcss: ^4.1.11
  @testing-library/dom: ^10.4.1
  @testing-library/jest-dom: ^6.6.3
  @testing-library/react: ^16.3.0
  @types/node: ^22.12.0
  @types/react: 18.3.3
  @types/react-dom: 18.3.0
  @typescript-eslint/eslint-plugin: ^8.39.1
  @typescript-eslint/parser: ^8.39.1
  @vitejs/plugin-react: 4.7.0
  @vitest/ui: 1.6.1
  autoprefixer: ^10.4.21
  dotenv: ^17.2.1
  es-module-lexer: ^1.7.0
  eslint: 8.57.0
  eslint-config-prettier: 9.1.0
  eslint-plugin-import: ^2.29.1
  eslint-plugin-jsx-a11y: ^6.8.0
  eslint-plugin-react: 7.34.1
  eslint-plugin-react-hooks: ^5.2.0
  eslint-plugin-react-refresh: 0.4.6
  fast-glob: ^3.3.3
  glob: ^7.2.3
  globals: ^16.0.0
  jsdom: ^26.1.0
  picocolors: ^1.1.1
  postcss: ^8.5.3
  prettier: ^3.5.3
  recast: ^0.23.11
  supertest: ^7.1.1
  tailwindcss: ^3.4.17
  ts-node: 10.9.2
  typescript: 5.4.5
  vite: 7.1.3
  vite-plugin-pwa: ^1.0.0
  vitest: 1.6.1

## Arborescence
vite.config.ts *
tsconfig.json *
jsconfig.json (absent)
vitest.config.ts *

src
├── App.jsx
├── api
│   ├── public
│   │   ├── index.js
│   │   ├── produits.js
│   │   ├── promotions.js
│   │   ├── stock.js
│   │   └── supabaseClient.js
│   └── shared
│       └── supabaseEnv.js
├── assets
│   ├── logo-mamastock.png
│   └── logo-mamastock.svg
├── components
│   ├── CookieConsent.jsx
│   ├── DeleteAccountButton.jsx
│   ├── ErrorBoundary.jsx
│   ├── FactureImportModal.jsx
│   ├── FactureLigne.jsx
│   ├── FactureTable.jsx
│   ├── Footer.jsx
│   ├── LiquidBackground
│   │   ├── BubblesParticles.jsx
│   │   ├── LiquidBackground.jsx
│   │   ├── MouseLight.jsx
│   │   ├── TouchLight.jsx
│   │   ├── WavesBackground.jsx
│   │   └── index.js
│   ├── ProtectedRoute.jsx
│   ├── Reporting
│   │   └── GraphMultiZone.jsx
│   ├── ResetAuthButton.jsx
│   ├── Sidebar.jsx
│   ├── ToastRoot.jsx
│   ├── Utilisateurs
│   │   └── UtilisateurRow.jsx
│   ├── achats
│   │   └── AchatRow.jsx
│   ├── analytics
│   │   └── CostCenterAllocationModal.jsx
│   ├── bons_livraison
│   │   └── BonLivraisonRow.jsx
│   ├── costing
│   │   └── CostingCartePDF.jsx
│   ├── dashboard
│   │   ├── DashboardCard.jsx
│   │   ├── GadgetConfigForm.jsx
│   │   ├── PeriodFilter.jsx
│   │   └── WidgetRenderer.jsx
│   ├── documents
│   │   ├── DocumentPreview.jsx
│   │   └── DocumentUpload.jsx
│   ├── engineering
│   │   ├── EngineeringChart.jsx
│   │   ├── EngineeringFilters.jsx
│   │   └── ImportVentesExcel.jsx
│   ├── export
│   │   ├── ExportManager.jsx
│   │   └── FicheExportView.jsx
│   ├── factures
│   │   ├── FactureRow.jsx
│   │   ├── PriceDelta.jsx
│   │   ├── ProduitSearchModal.jsx
│   │   ├── SupplierBrowserModal.jsx
│   │   └── SupplierPicker.jsx
│   ├── fiches
│   │   ├── FicheLigne.jsx
│   │   ├── FicheRentabiliteCard.jsx
│   │   └── FicheRow.jsx
│   ├── filters
│   │   └── SupplierFilter.jsx
│   ├── forms
│   │   ├── AutocompleteProduit.jsx
│   │   ├── MoneyInputFR.jsx
│   │   ├── NumericInput.jsx
│   │   ├── NumericInputFR.jsx
│   │   └── ProductPickerModal.jsx
│   ├── fournisseurs
│   │   ├── FournisseurFormModal.jsx
│   │   └── FournisseurRow.jsx
│   ├── gadgets
│   │   ├── GadgetAlerteStockFaible.jsx
│   │   ├── GadgetBudgetMensuel.jsx
│   │   ├── GadgetConsoMoyenne.jsx
│   │   ├── GadgetDerniersAcces.jsx
│   │   ├── GadgetEvolutionAchats.jsx
│   │   ├── GadgetProduitsUtilises.jsx
│   │   ├── GadgetTachesUrgentes.jsx
│   │   └── GadgetTopFournisseurs.jsx
│   ├── help
│   │   ├── DocumentationPanel.jsx
│   │   ├── FeedbackForm.jsx
│   │   ├── GuidedTour.jsx
│   │   └── TooltipHelper.jsx
│   ├── ia
│   │   └── RecommandationsBox.jsx
│   ├── inventaire
│   │   └── InventaireLigneRow.jsx
│   ├── inventaires
│   │   ├── InventaireDetail.jsx
│   │   └── InventaireForm.jsx
│   ├── layout
│   │   └── Sidebar.jsx
│   ├── mouvements
│   │   └── MouvementFormModal.jsx
│   ├── parametrage
│   │   ├── FamilleRow.jsx
│   │   ├── ParamAccess.jsx
│   │   ├── ParamCostCenters.jsx
│   │   ├── ParamFamilles.jsx
│   │   ├── ParamMama.jsx
│   │   ├── ParamRoles.jsx
│   │   ├── ParamSecurity.jsx
│   │   ├── ParamUnites.jsx
│   │   ├── SousFamilleList.jsx
│   │   ├── SousFamilleModal.jsx
│   │   ├── SousFamilleRow.jsx
│   │   ├── UniteRow.jsx
│   │   ├── UtilisateurRow.jsx
│   │   ├── ZoneFormProducts.jsx
│   │   └── ZoneRow.jsx
│   ├── pdf
│   │   └── CommandePDF.jsx
│   ├── produits
│   │   ├── ModalImportProduits.jsx
│   │   ├── ProduitDetail.jsx
│   │   ├── ProduitForm.jsx
│   │   ├── ProduitFormModal.jsx
│   │   ├── ProduitRow.jsx
│   │   └── priceHelpers.js
│   ├── promotions
│   │   └── PromotionRow.jsx
│   ├── requisitions
│   │   └── RequisitionRow.jsx
│   ├── security
│   │   └── TwoFactorSetup.jsx
│   ├── simulation
│   │   └── SimulationDetailsModal.jsx
│   ├── stock
│   │   ├── AlertBadge.jsx
│   │   └── StockDetail.jsx
│   ├── taches
│   │   ├── TacheForm.jsx
│   │   └── TachesKanban.jsx
│   ├── ui
│   │   ├── AutoCompleteField.jsx
│   │   ├── AutoCompleteZoneField.jsx
│   │   ├── Breadcrumbs.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Form.jsx
│   │   ├── FormActions.jsx
│   │   ├── FormField.jsx
│   │   ├── GlassCard.jsx
│   │   ├── ImportPreviewTable.jsx
│   │   ├── InputField.jsx
│   │   ├── LanguageSelector.jsx
│   │   ├── ListingContainer.jsx
│   │   ├── LoadingScreen.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── MamaLogo.jsx
│   │   ├── ModalGlass.jsx
│   │   ├── PageIntro.jsx
│   │   ├── PageSkeleton.jsx
│   │   ├── PageWrapper.jsx
│   │   ├── PaginationFooter.jsx
│   │   ├── PreviewBanner.jsx
│   │   ├── PrimaryButton.jsx
│   │   ├── SecondaryButton.jsx
│   │   ├── SmartDialog.jsx
│   │   ├── StatCard.jsx
│   │   ├── TableContainer.jsx
│   │   ├── TableHeader.jsx
│   │   ├── badge.jsx
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── checkbox.jsx
│   │   ├── controls
│   │   │   └── index.jsx
│   │   ├── dialog.jsx
│   │   ├── dropdown-menu.jsx
│   │   ├── input.jsx
│   │   ├── label.jsx
│   │   ├── select.jsx
│   │   └── tabs.jsx
│   └── utilisateurs
│       ├── UtilisateurDetail.jsx
│       └── UtilisateurForm.jsx
├── config
│   └── modules.js
├── constants
│   ├── accessKeys.js
│   ├── factures.js
│   └── tables.js
├── context
│   ├── HelpProvider.jsx
│   ├── MultiMamaContext.jsx
│   └── ThemeProvider.jsx
├── contexts
│   ├── AuthContext.d.ts
│   └── AuthContext.jsx
├── db
│   └── license-keys.json
├── features
│   └── factures
│       └── invoiceMappers.ts
├── forms
│   ├── FamilleForm.jsx
│   ├── PeriodeForm.jsx
│   ├── SousFamilleForm.jsx
│   ├── UniteForm.jsx
│   └── ZoneForm.jsx
├── globals.css
├── hooks
│   ├── _shared
│   │   └── createAsyncState.ts
│   ├── data
│   │   ├── useFactures.js
│   │   └── useFournisseurs.js
│   ├── gadgets
│   │   ├── useAchatsMensuels.js
│   │   ├── useAlerteStockFaible.js
│   │   ├── useBudgetMensuel.js
│   │   ├── useConsoMoyenne.js
│   │   ├── useDerniersAcces.js
│   │   ├── useEvolutionAchats.js
│   │   ├── useProduitsUtilises.js
│   │   ├── useTachesUrgentes.js
│   │   └── useTopFournisseurs.js
│   ├── useAccess.js
│   ├── useAchats.js
│   ├── useAdvancedStats.js
│   ├── useAide.js
│   ├── useAlerteStockFaible.js
│   ├── useAlerts.js
│   ├── useAnalyse.js
│   ├── useAnalytique.js
│   ├── useApiFournisseurs.js
│   ├── useApiKeys.js
│   ├── useAuditLog.js
│   ├── useAuth.ts
│   ├── useBonsLivraison.js
│   ├── useCarte.js
│   ├── useCommandes.js
│   ├── useComparatif.js
│   ├── useConsentements.js
│   ├── useConsolidatedStats.js
│   ├── useConsolidation.js
│   ├── useCostCenterMonthlyStats.js
│   ├── useCostCenterStats.js
│   ├── useCostCenterSuggestions.js
│   ├── useCostCenters.js
│   ├── useCostingCarte.js
│   ├── useDashboard.js
│   ├── useDashboardStats.js
│   ├── useDashboards.js
│   ├── useDebounce.js
│   ├── useDocuments.js
│   ├── useEcartsInventaire.js
│   ├── useEmailsEnvoyes.js
│   ├── useEnrichedProducts.js
│   ├── useExport.js
│   ├── useExportCompta.js
│   ├── useFactureForm.js
│   ├── useFactures.js
│   ├── useFacturesAutocomplete.js
│   ├── useFacturesList.js
│   ├── useFamilles.js
│   ├── useFamillesWithSousFamilles.js
│   ├── useFeedback.js
│   ├── useFicheCoutHistory.js
│   ├── useFiches.js
│   ├── useFichesAutocomplete.js
│   ├── useFichesTechniques.js
│   ├── useFormErrors.js
│   ├── useFormatters.js
│   ├── useFournisseurAPI.js
│   ├── useFournisseurApiConfig.js
│   ├── useFournisseurNotes.js
│   ├── useFournisseurStats.js
│   ├── useFournisseurs.js
│   ├── useFournisseursAutocomplete.js
│   ├── useFournisseursBrowse.js
│   ├── useFournisseursInactifs.js
│   ├── useFournisseursList.js
│   ├── useFournisseursRecents.js
│   ├── useGadgets.js
│   ├── useGlobalSearch.js
│   ├── useGraphiquesMultiZone.js
│   ├── useHelpArticles.js
│   ├── useInventaireLignes.js
│   ├── useInventaireZones.js
│   ├── useInventaires.js
│   ├── useInvoice.ts
│   ├── useInvoiceImport.js
│   ├── useInvoiceItems.js
│   ├── useInvoiceOcr.js
│   ├── useInvoices.js
│   ├── useLogs.js
│   ├── useMama.js
│   ├── useMamaSettings.js
│   ├── useMamaSwitcher.js
│   ├── useMamas.js
│   ├── useMenuDuJour.js
│   ├── useMenuEngineering.js
│   ├── useMenuGroupe.js
│   ├── useMenus.js
│   ├── useMouvementCostCenters.js
│   ├── useNotifications.js
│   ├── useOnboarding.js
│   ├── usePerformanceFiches.js
│   ├── usePeriodes.js
│   ├── usePermissions.js
│   ├── usePertes.js
│   ├── usePlanning.js
│   ├── usePriceTrends.js
│   ├── useProducts.js
│   ├── useProduitLineDefaults.js
│   ├── useProduitsAutocomplete.js
│   ├── useProduitsFournisseur.js
│   ├── useProduitsInventaire.js
│   ├── useProduitsSearch.js
│   ├── usePromotions.js
│   ├── useRGPD.js
│   ├── useRecommendations.js
│   ├── useReporting.js
│   ├── useRequisitions.js
│   ├── useRoles.js
│   ├── useRuptureAlerts.js
│   ├── useSignalements.js
│   ├── useSimulation.js
│   ├── useSousFamilles.js
│   ├── useStats.js
│   ├── useStock.js
│   ├── useStockRequisitionne.js
│   ├── useStorage.js
│   ├── useSwipe.js
│   ├── useTacheAssignation.js
│   ├── useTaches.js
│   ├── useTasks.js
│   ├── useTemplatesCommandes.js
│   ├── useTopProducts.js
│   ├── useTransferts.js
│   ├── useTwoFactorAuth.js
│   ├── useUnites.js
│   ├── useUsageStats.js
│   ├── useUtilisateurs.js
│   ├── useValidations.js
│   ├── useZoneProducts.js
│   ├── useZoneRights.js
│   ├── useZones.js
│   └── useZonesStock.js
├── i18n
│   ├── i18n.js
│   └── locales
│       ├── en.json
│       ├── es.json
│       └── fr.json
├── layout
│   ├── AdminLayout.jsx
│   ├── Layout.jsx
│   ├── LegalLayout.jsx
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   └── ViewerLayout.jsx
├── lib
│   ├── access.js
│   ├── access.ts
│   ├── export
│   │   └── exportHelpers.js
│   ├── lazyWithPreload.js
│   ├── loginUser.js
│   ├── react-query.js
│   ├── roleUtils.js
│   ├── supa
│   │   └── logError.js
│   ├── supabase.ts
│   ├── utils.js
│   └── xlsx
│       └── safeImportXLSX.js
├── license.js
├── main.jsx
├── pages
│   ├── Accueil.jsx
│   ├── AideContextuelle.jsx
│   ├── Alertes.jsx
│   ├── BarManager.jsx
│   ├── CartePlats.jsx
│   ├── Consentements.jsx
│   ├── Dashboard.jsx
│   ├── EngineeringMenu.jsx
│   ├── Feedback.jsx
│   ├── HelpCenter.jsx
│   ├── Journal.jsx
│   ├── NotFound.jsx
│   ├── Onboarding.jsx
│   ├── Parametres
│   │   └── Familles.jsx
│   ├── Pertes.jsx
│   ├── Planning.jsx
│   ├── PlanningDetail.jsx
│   ├── PlanningForm.jsx
│   ├── PlanningModule.jsx
│   ├── Rgpd.jsx
│   ├── Stock.jsx
│   ├── Utilisateurs.jsx
│   ├── Validations.jsx
│   ├── achats
│   │   ├── AchatDetail.jsx
│   │   ├── AchatForm.jsx
│   │   └── Achats.jsx
│   ├── aide
│   │   ├── Aide.jsx
│   │   └── AideForm.jsx
│   ├── analyse
│   │   ├── Analyse.jsx
│   │   ├── AnalyseCostCenter.jsx
│   │   ├── MenuEngineering.jsx
│   │   └── TableauxDeBord.jsx
│   ├── analytique
│   │   └── AnalytiqueDashboard.jsx
│   ├── auth
│   │   ├── Blocked.jsx
│   │   ├── CreateMama.jsx
│   │   ├── Login.jsx
│   │   ├── Logout.jsx
│   │   ├── Pending.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── RoleError.jsx
│   │   ├── Unauthorized.jsx
│   │   └── UpdatePassword.jsx
│   ├── bons_livraison
│   │   ├── BLCreate.jsx
│   │   ├── BLDetail.jsx
│   │   ├── BLForm.jsx
│   │   └── BonsLivraison.jsx
│   ├── carte
│   │   └── Carte.jsx
│   ├── catalogue
│   │   └── CatalogueSyncViewer.jsx
│   ├── commandes
│   │   ├── CommandeDetail.jsx
│   │   ├── CommandeForm.jsx
│   │   ├── Commandes.jsx
│   │   └── CommandesEnvoyees.jsx
│   ├── consolidation
│   │   ├── AccessMultiSites.jsx
│   │   └── Consolidation.jsx
│   ├── costboisson
│   │   └── CostBoisson.jsx
│   ├── costing
│   │   └── CostingCarte.jsx
│   ├── cuisine
│   │   └── MenuDuJour.jsx
│   ├── dashboard
│   │   └── DashboardBuilder.jsx
│   ├── debug
│   │   ├── AccessExample.jsx
│   │   ├── AuthDebug.jsx
│   │   ├── Debug.jsx
│   │   ├── DebugAuth.jsx
│   │   ├── DebugRights.jsx
│   │   └── DebugUser.jsx
│   ├── documents
│   │   ├── DocumentForm.jsx
│   │   └── Documents.jsx
│   ├── ecarts
│   │   └── Ecarts.jsx
│   ├── emails
│   │   └── EmailsEnvoyes.jsx
│   ├── engineering
│   │   └── MenuEngineering.jsx
│   ├── factures
│   │   ├── FactureCreate.jsx
│   │   ├── FactureDetail.jsx
│   │   ├── FactureForm.jsx
│   │   ├── Factures.jsx
│   │   └── ImportFactures.jsx
│   ├── fiches
│   │   ├── FicheDetail.jsx
│   │   ├── FicheForm.jsx
│   │   └── Fiches.jsx
│   ├── fournisseurs
│   │   ├── ApiFournisseurForm.jsx
│   │   ├── ApiFournisseurs.jsx
│   │   ├── FournisseurApiSettingsForm.jsx
│   │   ├── FournisseurCreate.jsx
│   │   ├── FournisseurDetail.jsx
│   │   ├── FournisseurDetailPage.jsx
│   │   ├── FournisseurForm.jsx
│   │   ├── Fournisseurs.jsx
│   │   └── comparatif
│   │       ├── ComparatifPrix.jsx
│   │       └── PrixFournisseurs.jsx
│   ├── inventaire
│   │   ├── EcartInventaire.jsx
│   │   ├── Inventaire.jsx
│   │   ├── InventaireDetail.jsx
│   │   ├── InventaireForm.jsx
│   │   └── InventaireZones.jsx
│   ├── legal
│   │   ├── Cgu.jsx
│   │   ├── Cgv.jsx
│   │   ├── Confidentialite.jsx
│   │   ├── Contact.jsx
│   │   ├── Licence.jsx
│   │   └── MentionsLegales.jsx
│   ├── menu
│   │   ├── MenuDuJour.jsx
│   │   └── MenuDuJourJour.jsx
│   ├── menus
│   │   ├── MenuDetail.jsx
│   │   ├── MenuDuJour.jsx
│   │   ├── MenuDuJourDetail.jsx
│   │   ├── MenuDuJourForm.jsx
│   │   ├── MenuForm.jsx
│   │   ├── MenuGroupeDetail.jsx
│   │   ├── MenuGroupeForm.jsx
│   │   ├── MenuGroupes.jsx
│   │   ├── MenuPDF.jsx
│   │   └── Menus.jsx
│   ├── mobile
│   │   ├── MobileAccueil.jsx
│   │   ├── MobileInventaire.jsx
│   │   └── MobileRequisition.jsx
│   ├── notifications
│   │   ├── NotificationSettingsForm.jsx
│   │   └── NotificationsInbox.jsx
│   ├── onboarding
│   │   └── OnboardingUtilisateur.jsx
│   ├── parametrage
│   │   ├── APIKeys.jsx
│   │   ├── AccessRights.jsx
│   │   ├── CentreCoutForm.jsx
│   │   ├── ExportComptaPage.jsx
│   │   ├── ExportUserData.jsx
│   │   ├── Familles.jsx
│   │   ├── InvitationsEnAttente.jsx
│   │   ├── InviteUser.jsx
│   │   ├── MamaForm.jsx
│   │   ├── MamaSettingsForm.jsx
│   │   ├── Mamas.jsx
│   │   ├── Parametrage.jsx
│   │   ├── ParametresCommandes.jsx
│   │   ├── Periodes.jsx
│   │   ├── Permissions.jsx
│   │   ├── PermissionsAdmin.jsx
│   │   ├── PermissionsForm.jsx
│   │   ├── RGPDConsentForm.jsx
│   │   ├── RoleForm.jsx
│   │   ├── Roles.jsx
│   │   ├── SousFamilles.jsx
│   │   ├── TemplateCommandeForm.jsx
│   │   ├── TemplatesCommandes.jsx
│   │   ├── Unites.jsx
│   │   ├── Utilisateurs.jsx
│   │   ├── ZoneAccess.jsx
│   │   ├── ZoneForm.jsx
│   │   └── Zones.jsx
│   ├── planning
│   │   └── SimulationPlanner.jsx
│   ├── produits
│   │   ├── ProduitDetail.jsx
│   │   ├── ProduitForm.jsx
│   │   └── Produits.jsx
│   ├── promotions
│   │   ├── PromotionForm.jsx
│   │   └── Promotions.jsx
│   ├── public
│   │   ├── LandingPage.jsx
│   │   ├── Onboarding.jsx
│   │   └── Signup.jsx
│   ├── receptions
│   │   └── Receptions.jsx
│   ├── recettes
│   │   └── Recettes.jsx
│   ├── reporting
│   │   ├── GraphCost.jsx
│   │   ├── Reporting.jsx
│   │   └── ReportingPDF.jsx
│   ├── requisitions
│   │   ├── RequisitionDetail.jsx
│   │   ├── RequisitionForm.jsx
│   │   └── Requisitions.jsx
│   ├── signalements
│   │   ├── SignalementDetail.jsx
│   │   ├── SignalementForm.jsx
│   │   └── Signalements.jsx
│   ├── simulation
│   │   ├── Simulation.jsx
│   │   ├── SimulationForm.jsx
│   │   ├── SimulationMenu.jsx
│   │   └── SimulationResult.jsx
│   ├── stats
│   │   ├── Stats.jsx
│   │   ├── StatsAdvanced.jsx
│   │   ├── StatsConsolidation.jsx
│   │   ├── StatsCostCenters.jsx
│   │   ├── StatsCostCentersPivot.jsx
│   │   ├── StatsFiches.jsx
│   │   └── StatsStock.jsx
│   ├── stock
│   │   ├── AlertesRupture.jsx
│   │   ├── Inventaire.jsx
│   │   ├── InventaireForm.jsx
│   │   ├── Requisitions.jsx
│   │   ├── TransfertForm.jsx
│   │   └── Transferts.jsx
│   ├── supervision
│   │   ├── ComparateurFiches.jsx
│   │   ├── GroupeParamForm.jsx
│   │   ├── Logs.jsx
│   │   ├── Rapports.jsx
│   │   └── SupervisionGroupe.jsx
│   ├── surcouts
│   │   └── Surcouts.jsx
│   └── taches
│       ├── Alertes.jsx
│       ├── TacheDetail.jsx
│       ├── TacheForm.jsx
│       ├── TacheNew.jsx
│       └── Taches.jsx
├── registerSW.js
├── router
│   └── PrivateOutlet.jsx
├── router.jsx
├── types
│   ├── requisitions.ts
│   └── supabase.d.ts
├── utils
│   ├── __tests__
│   │   ├── number.test.ts
│   │   └── numberFormat.test.ts
│   ├── excelUtils.js
│   ├── exportExcelProduits.js
│   ├── factures
│   │   └── mappers.js
│   ├── formIds.js
│   ├── formatNumberLive.ts
│   ├── importExcelProduits.js
│   ├── number.ts
│   ├── numberFormat.ts
│   ├── permissions.js
│   ├── selectSafe.js
│   └── watermark.js
└── workers
    └── NotificationServiceWorker.js
test
├── CommandeForm.test.jsx
├── Commandes.test.jsx
├── ComparatifPrix.test.jsx
├── CostingCarte.test.jsx
├── FactureLigne.format.test.jsx
├── FactureLigne.test.jsx
├── Feedback.test.jsx
├── FicheDetail.test.jsx
├── FicheForm.test.jsx
├── FournisseurApiConfigs.test.jsx
├── FournisseurApiSettingsForm.test.jsx
├── FournisseurFormModal.test.jsx
├── Fournisseurs.test.jsx
├── ImportFactures.test.jsx
├── ImportProduitsExcel.test.js
├── InventaireDetail.test.jsx
├── InventaireForm.test.jsx
├── InventaireZones.test.jsx
├── Layout.test.jsx
├── Login.test.jsx
├── MenuDuJour.test.jsx
├── MenuEngineering.test.jsx
├── MenuGroupeForm.test.jsx
├── MenuGroupes.test.jsx
├── MoneyInputFR.test.jsx
├── Planning.test.jsx
├── PriceDelta.test.jsx
├── PrixFournisseurs.test.jsx
├── ProduitDetail.test.jsx
├── ProduitForm.subfam.test.jsx
├── ProduitForm.test.jsx
├── Produits.test.jsx
├── ProtectedRoute.test.jsx
├── Sidebar.parametrage.test.jsx
├── StockDetail.test.jsx
├── Taches.test.jsx
├── Transferts.test.jsx
├── Utilisateurs.test.jsx
├── ZoneFormProducts.test.jsx
├── ZonesPage.test.jsx
├── __mocks__
│   ├── hooks
│   │   ├── useAuth.ts
│   │   └── usePeriodes.ts
│   └── src
│       └── hooks
│           ├── gadgets
│           ├── useAccess.js
│           ├── useAchats.js
│           ├── useAdvancedStats.js
│           ├── useAide.js
│           ├── useAlerts.js
│           ├── useAnalyse.js
│           ├── useAnalytique.js
│           ├── useApiFournisseurs.js
│           ├── useApiKeys.js
│           ├── useAuditLog.js
│           ├── useAuth.js
│           ├── useBonsLivraison.js
│           ├── useCarte.js
│           ├── useCommandes.js
│           ├── useComparatif.js
│           ├── useConsentements.js
│           ├── useConsolidatedStats.js
│           ├── useConsolidation.js
│           ├── useCostCenterMonthlyStats.js
│           ├── useCostCenterStats.js
│           ├── useCostCenterSuggestions.js
│           ├── useCostCenters.js
│           ├── useCostingCarte.js
│           ├── useDashboard.js
│           ├── useDashboardStats.js
│           ├── useDashboards.js
│           ├── useDocuments.js
│           ├── useEcartsInventaire.js
│           ├── useEmailsEnvoyes.js
│           ├── useEnrichedProducts.js
│           ├── useExport.js
│           ├── useExportCompta.js
│           ├── useFactureForm.js
│           ├── useFactures.js
│           ├── useFacturesAutocomplete.js
│           ├── useFamilles.js
│           ├── useFamillesWithSousFamilles.js
│           ├── useFeedback.js
│           ├── useFicheCoutHistory.js
│           ├── useFiches.js
│           ├── useFichesAutocomplete.js
│           ├── useFichesTechniques.js
│           ├── useFormErrors.js
│           ├── useFormatters.js
│           ├── useFournisseurAPI.js
│           ├── useFournisseurApiConfig.js
│           ├── useFournisseurNotes.js
│           ├── useFournisseurStats.js
│           ├── useFournisseurs.js
│           ├── useFournisseursAutocomplete.js
│           ├── useFournisseursInactifs.js
│           ├── useGadgets.js
│           ├── useGlobalSearch.js
│           ├── useGraphiquesMultiZone.js
│           ├── useHelpArticles.js
│           ├── useInventaireLignes.js
│           ├── useInventaireZones.js
│           ├── useInventaires.js
│           ├── useInvoiceImport.js
│           ├── useInvoiceItems.js
│           ├── useInvoiceOcr.js
│           ├── useInvoices.js
│           ├── useLogs.js
│           ├── useMama.js
│           ├── useMamaSettings.js
│           ├── useMamaSwitcher.js
│           ├── useMamas.js
│           ├── useMenuDuJour.js
│           ├── useMenuEngineering.js
│           ├── useMenuGroupe.js
│           ├── useMenus.js
│           ├── useMouvementCostCenters.js
│           ├── useNotifications.js
│           ├── useOnboarding.js
│           ├── usePerformanceFiches.js
│           ├── usePeriodes.js
│           ├── usePermissions.js
│           ├── usePertes.js
│           ├── usePlanning.js
│           ├── usePriceTrends.js
│           ├── useProducts.js
│           ├── useProduitsAutocomplete.js
│           ├── useProduitsFournisseur.js
│           ├── useProduitsInventaire.js
│           ├── usePromotions.js
│           ├── useRGPD.js
│           ├── useRecommendations.js
│           ├── useReporting.js
│           ├── useRequisitions.js
│           ├── useRoles.js
│           ├── useRuptureAlerts.js
│           ├── useSignalements.js
│           ├── useSimulation.js
│           ├── useSousFamilles.js
│           ├── useStats.js
│           ├── useStock.js
│           ├── useStockRequisitionne.js
│           ├── useStorage.js
│           ├── useSupabaseClient.js
│           ├── useSwipe.js
│           ├── useTacheAssignation.js
│           ├── useTaches.js
│           ├── useTasks.js
│           ├── useTemplatesCommandes.js
│           ├── useTopProducts.js
│           ├── useTransferts.js
│           ├── useTwoFactorAuth.js
│           ├── useUnites.js
│           ├── useUsageStats.js
│           ├── useUtilisateurs.js
│           ├── useValidations.js
│           ├── useZoneProducts.js
│           ├── useZoneRights.js
│           ├── useZones.js
│           └── useZonesStock.js
├── a11y-forms-smoke.test.jsx
├── backup_db.test.js
├── cli_help.test.js
├── cli_utils.test.js
├── cli_version.test.js
├── duplicateProduct.test.js
├── exportHelpers.test.js
├── export_accounting.test.js
├── form-layout.test.jsx
├── getSupabaseEnv.test.js
├── globals.d.ts
├── loginUser.test.js
├── mocks
│   ├── supabaseClient.d.ts
│   └── supabaseClient.js
├── public_api.test.js
├── reallocate_history.test.js
├── router.test.jsx
├── sdk_abort_signal.test.js
├── sdk_auth_env.test.js
├── sdk_base_url_env.test.js
├── sdk_custom_fetch.test.js
├── sdk_headers.test.js
├── sdk_helpers_signal.test.js
├── sdk_mama_id.test.js
├── sdk_mama_id_env.test.js
├── sdk_produits_filters.test.js
├── sdk_promotions_filters.test.js
├── sdk_rate_limit.test.js
├── sdk_retry_env.test.js
├── sdk_stock_filters.test.js
├── sdk_timeout.test.js
├── sdk_timeout_env.test.js
├── sdk_update_options.test.js
├── sdk_user_agent_env.test.js
├── setup.ts
├── setupTests.ts
├── sousFamilles.hook.test.jsx
├── supabase_env.test.js
├── types
│   └── node-fetch.d.ts
├── useAdvancedStats.test.js
├── useAlerteStockFaible.test.js
├── useAlerts.test.js
├── useAuditLog.test.js
├── useCommandes.test.js
├── useConsolidatedStats.test.js
├── useConsolidation.test.js
├── useCostCenterMonthlyStats.test.js
├── useCostCenterStats.test.js
├── useCostCenterSuggestions.test.js
├── useCostCenters.test.js
├── useCostingCarte.test.jsx
├── useDashboard.test.js
├── useDocuments.test.js
├── useEmailsEnvoyes.test.js
├── useExport.test.js
├── useFactures.test.js
├── useFacturesAutocomplete.test.js
├── useFiches.test.js
├── useFichesAutocomplete.test.js
├── useFournisseurAPI.test.js
├── useFournisseurApiConfig.test.js
├── useFournisseurs.test.jsx
├── useFournisseursAutocomplete.test.js
├── useFournisseursInactifs.test.js
├── useGlobalSearch.test.js
├── useHelpArticles.test.js
├── useInventaireLignes.test.js
├── useInventaires.test.js
├── useInvoiceImport.test.js
├── useInvoiceItems.test.js
├── useInvoiceOcr.test.js
├── useInvoices.test.js
├── useLogs.test.js
├── useMenuDuJour.test.jsx
├── useMenuEngineering.test.js
├── useMenuGroupe.test.js
├── useMenus.test.js
├── useNotifications.test.js
├── useOnboarding.test.js
├── usePertes.test.js
├── usePlanning.test.js
├── usePriceTrends.test.jsx
├── useProductsPrices.test.js
├── useProductsView.test.js
├── useProduitsAutocomplete.test.js
├── useProduitsFournisseur.test.js
├── useProduitsInventaire.test.js
├── useProduitsSearch.test.jsx
├── usePromotions.test.js
├── useRequisitions.test.js
├── useRuptureAlerts.test.js
├── useSimulation.test.js
├── useStockRequisitionne.test.js
├── useStorage.test.js
├── useSwipe.test.js
├── useTaches.test.js
├── useTasks.test.js
├── useTemplatesCommandes.test.js
├── useTopProducts.test.js
├── useTransferts.test.js
├── useTwoFactorAuth.test.js
├── useUtilisateurs.test.js
├── useValidations.test.js
├── useZoneProducts.test.jsx
├── useZones.test.js
├── visual_update.test.js
├── vite.config.test.js
└── weekly_report.test.js

122 directories, 800 files

## Fichiers clés
### vite.config.ts

```
// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'public',
      filename: 'service-worker.js',
      manifest: {
        name: 'MamaStock',
        short_name: 'MamaStock',
        description: 'Application de gestion de stock pour Mama Shelter',
        start_url: '/',
        display: 'standalone',
        background_color: '#f0f0f5',
        theme_color: '#bfa14d',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 👈 définit @ comme racine de /src
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false,
    },
  },
  define: {
    'process.env': {}, // évite "process is not defined" côté navigateur
  },
});

```

### tsconfig.json

```
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@hooks/*": ["src/hooks/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"]
    },
    "types": ["vitest/globals"]
  },
  "include": ["src", "test", "vitest.config.ts", "vite.config.ts"]
}

```

### jsconfig.json
(absent)\n
### vitest.config.ts

```
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['test/setup.ts'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});

```

### src/lib/supabase.ts

```
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process?.env?.SUPABASE_URL ||
  process?.env?.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  process?.env?.SUPABASE_ANON_KEY ||
  process?.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

const supabase: SupabaseClient =
  (globalThis as any).__SUPABASE_TEST_CLIENT__ ||
  createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export default supabase;
export { supabase };

```

### src/utils/numberFormat.ts

```
export function formatMoneyFR(n: number | string, opts?: Intl.NumberFormatOptions): string {
  const value = typeof n === 'string' ? Number(n) : n;
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  });
  return formatter.format(value).replace(/[\u202F\u00A0]/g, ' ');
}

export function parseMoneyToNumberFR(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  const cleaned = v
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  if (cleaned === '') return 0;
  const parts = cleaned.split('.');
  const last = parts.pop() as string;
  const numberString = parts.length ? parts.join('') + '.' + last : last;
  const n = Number(numberString);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeDecimalFR(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const str = typeof v === 'number' ? String(v) : v;
  const replaced = str
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, ',');
  let result = '';
  let commaUsed = false;
  for (const ch of replaced) {
    if (/\d/.test(ch)) {
      result += ch;
    } else if (ch === ',' && !commaUsed) {
      result += ',';
      commaUsed = true;
    }
  }
  return result;
}

export function roundTo(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}


```

### src/hooks/useFactures.js

```
// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState } from "react";

import { useAuth } from '@/hooks/useAuth';
import usePeriodes from "@/hooks/usePeriodes";

export function useFactures() {
  const { mama_id } = useAuth();
  const { checkCurrentPeriode } = usePeriodes();
  const [factures, setFactures] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getBonsLivraison({ search = "", page = 1, limit = 50 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("bons_livraison")
      .select(
        "id, numero_bl, date_reception, actif, fournisseur_id, mama_id, created_at, lignes:lignes_bl!bl_id(id)",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .order("date_reception", { ascending: false });
    if (search) q = q.ilike("numero_bl", `%${search}%`);
    q = q.range((page - 1) * limit, page * limit - 1);
    const { data, error, count } = await q;
    if (!error) {
      setFactures(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function getFactures({
    search = "",
    fournisseur = "",
    statut = "",
    mois = "",
    page = 1,
    pageSize = 20
  } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("factures")
      .select(
        "id, numero, date_facture, montant, statut, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!factures_fournisseur_id_fkey(id, nom)",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .order("date_facture", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) {
      query = query.or(
        `numero.ilike.%${search}%,fournisseurs.nom.ilike.%${search}%`
      );
    }
    if (fournisseur) query = query.eq("fournisseur_id", fournisseur);
    if (statut) query = query.eq("statut", statut);
    if (mois) {
      const start = `${mois}-01`;
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const endStr = end.toISOString().slice(0, 10);
      query = query.gte("date_facture", start).lt("date_facture", endStr);
    }

    const { data, error, count } = await query;
    if (!error) {
      setFactures(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function fetchFactureById(id) {
    if (!id || !mama_id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("factures")
      .select(
        "id, numero, date_facture, montant, statut, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!factures_fournisseur_id_fkey(id, nom)"
      )
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return null;
    }
    return data;
  }

  async function createFacture(data) {
    if (!mama_id) return { error: "no mama_id" };
    const { error: pErr } = await checkCurrentPeriode(data.date_facture);
    if (pErr) return { error: pErr };
    setLoading(true);
    setError(null);
    const { data: inserted, error } = await supabase.
    from("factures").
    insert([{ ...data, mama_id }]).
    select().
    single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setFactures((f) => [inserted, ...f]);
    return { data: inserted };
  }

  async function updateFacture(id, fields) {
    if (!mama_id) return { error: "no mama_id" };
    if (fields.date_facture) {
      const { error: pErr } = await checkCurrentPeriode(fields.date_facture);
      if (pErr) return { error: pErr };
    }
    setLoading(true);
    setError(null);
    const { data: updated, error } = await supabase.
    from("factures").
    update(fields).
    eq("id", id).
    eq("mama_id", mama_id).
    select().
    single();
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setFactures((f) => f.map((ft) => ft.id === id ? updated : ft));
    return { data: updated };
  }

  async function deleteFacture(id) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("factures")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    setFactures((f) => f.filter((ft) => ft.id !== id));
    return { success: true };
  }

  async function addLigneFacture(facture_id, ligne) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    setError(null);
    const {
      fournisseur_id,
      produit_id,
      quantite,
      prix_unitaire,
      tva,
      zone_stock_id,
      unite_id,
      date
    } = ligne || {};
    const { data: inserted, error } = await supabase.
    from("facture_lignes").
    insert([
    {
      produit_id,
      quantite,
      prix_unitaire,
      tva,
      zone_stock_id,
      unite_id,
      total: quantite * (prix_unitaire || 0),
      facture_id,
      mama_id
    }]
    ).
    select().
    single();
    if (!error && produit_id && fournisseur_id) {
      await supabase.
      from("fournisseur_produits").
      upsert(
        {
          produit_id,
          fournisseur_id,
          prix_achat: prix_unitaire,
          date_livraison: date || new Date().toISOString().slice(0, 10),
          mama_id
        },
        { onConflict: ["produit_id", "fournisseur_id", "date_livraison"] }
      );
      await supabase.
      from("achats").
      insert([
      {
        produit_id,
        fournisseur_id,
        mama_id,
        prix: prix_unitaire,
        quantite,
        date_achat: date || new Date().toISOString().slice(0, 10)
      }]
      );
    }
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { data: inserted };
  }

  async function createBonLivraison(bl) {
    if (!mama_id) return { error: "no mama_id" };
    const { lignes, ...entete } = bl || {};
    setLoading(true);
    const { data, error } = await supabase.
    from("bons_livraison").
    insert([{ ...entete, mama_id }]).
    select("id").
    single();
    if (!error && data?.id && Array.isArray(lignes) && lignes.length) {
      const rows = lignes.map((l) => ({ ...l, bl_id: data.id, mama_id }));
      await supabase.from("lignes_bl").insert(rows);
    }
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { data };
  }

  async function updateStock(id, type) {
    if (!mama_id) return { error: "no mama_id" };
    setLoading(true);
    const table = type === "facture" ? "factures" : "bons_livraison";
    const { error } = await supabase.rpc("apply_stock_from_achat", {
      achat_id: id,
      achat_table: table,
      mama_id
    });
    setLoading(false);
    if (error) setError(error);
    return { error };
  }

  async function toggleFactureActive(id, actif) {
    return { error: null };
  }

  async function calculateTotals(facture_id) {
    if (!mama_id) return { ht: 0, tva: 0, ttc: 0 };
    const { data: lignes } = await supabase.
    from("facture_lignes").
    select("quantite, prix_unitaire, tva").
    eq("facture_id", facture_id).
    eq("mama_id", mama_id);
    const ht = (lignes || []).reduce((s, l) => s + l.quantite * (l.prix_unitaire || 0), 0);
    const tva = (lignes || []).reduce((s, l) => s + l.quantite * (l.prix_unitaire || 0) * (l.tva || 0) / 100, 0);
    const ttc = ht + tva;
    await supabase.
    from("factures").
    update({ total_ht: ht, total_tva: tva, total_ttc: ttc, montant_total: ttc }).
    eq("id", facture_id).
    eq("mama_id", mama_id);
    return { ht, tva, ttc };
  }

  return {
    factures,
    total,
    loading,
    error,
    getBonsLivraison,
    getFactures,
    fetchFactureById,
    createFacture,
    createBonLivraison,
    updateFacture,
    deleteFacture,
    addLigneFacture,
    updateStock,
    toggleFactureActive,
    calculateTotals
  };
}
```

### src/hooks/useBonsLivraison.js

```
// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState } from "react";

import { useAuth } from '@/hooks/useAuth';

export function useBonsLivraison() {
  const { mama_id } = useAuth();
  const [bons, setBons] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getBonsLivraison({ fournisseur = "", debut = "", fin = "", actif = true, page = 1, pageSize = 50 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("bons_livraison")
      .select(
        "id, numero_bl, date_reception, actif, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!bons_livraison_fournisseur_id_fkey(id, nom), lignes:lignes_bl!bl_id(id)",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .order("date_reception", { ascending: false })
    range((page - 1) * pageSize, page * pageSize - 1);
    if (fournisseur) q = q.eq("fournisseur_id", fournisseur);
    if (actif !== null) q = q.eq("actif", actif);
    if (debut) q = q.gte("date_reception", debut);
    if (fin) q = q.lte("date_reception", fin);
    const { data, error, count } = await q;
    if (!error) {
      setBons(Array.isArray(data) ? data : []);
      setTotal(count || 0);
    }
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function fetchBonLivraisonById(id) {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase
      .from("bons_livraison")
      .select(
        "id, numero_bl, date_reception, actif, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!bons_livraison_fournisseur_id_fkey(id, nom), lignes:lignes_bl!bl_id(id, bl_id, quantite_recue, prix_unitaire, tva, produit:produit_id(nom))"
      )
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setError(error);
      return null;
    }
    return data;
  }

  async function insertBonLivraison(bl) {
    if (!mama_id) return { error: "no mama_id" };
    const { lignes = [], ...header } = bl || {};
    setLoading(true);
    const { data, error } = await supabase.
    from("bons_livraison").
    insert([{ ...header, mama_id }]).
    select("id").
    single();
    if (!error && data?.id && lignes.length) {
      const rows = lignes.map((l) => ({ ...l, bl_id: data.id, mama_id }));
      const { error: err2 } = await supabase.from("lignes_bl").insert(rows);
      if (err2) {
        setLoading(false);
        setError(err2);
        return { error: err2 };
      }
    }
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { data };
  }

  async function updateBonLivraison(id, fields) {
    if (!mama_id) return { error: "no mama_id" };
    const { data, error } = await supabase.
    from("bons_livraison").
    update(fields).
    eq("id", id).
    eq("mama_id", mama_id).
    select().
    single();
    if (error) {
      setError(error);
      return { error };
    }
    return { data };
  }

  async function toggleBonActif(id, actif) {
    return updateBonLivraison(id, { actif });
  }

  return {
    bons,
    total,
    loading,
    error,
    getBonsLivraison,
    fetchBonLivraisonById,
    insertBonLivraison,
    updateBonLivraison,
    toggleBonActif
  };
}

export default useBonsLivraison;
```

### src/hooks/useCommandes.js

```
// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState, useCallback } from "react";

import { useAuth } from '@/hooks/useAuth';

export function useCommandes() {
  const { mama_id, user_id } = useAuth();
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCommandes = useCallback(
    async ({ fournisseur = "", statut = "", debut = "", fin = "", page = 1, limit = 20 } = {}) => {
      if (!mama_id) return { data: [], count: 0 };
      setLoading(true);
      setError(null);
      let query = supabase
        .from("commandes")
        .select(
          "id, date_commande, statut, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!commandes_fournisseur_id_fkey(id, nom, email), lignes:commande_lignes(id, total_ligne)",
          { count: "exact" }
        )
        .eq("mama_id", mama_id)
        .order("date_commande", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (fournisseur) query = query.eq("fournisseur_id", fournisseur);
      if (statut) query = query.eq("statut", statut);
      if (debut) query = query.gte("date_commande", debut);
      if (fin) query = query.lte("date_commande", fin);
      const { data, count, error } = await query;
      setLoading(false);
      if (error) {
        console.error("❌ fetchCommandes", error.message);
        setError(error);
        setData([]);
        setCount(0);
        return { data: [], count: 0 };
      }
      const rows = (data || []).map((c) => ({
        ...c,
        total: (c.lignes || []).reduce((s, l) => s + Number(l.total_ligne || 0), 0)
      }));
      setData(rows);
      setCount(count || 0);
      return { data: rows, count: count || 0 };
    },
    [mama_id]
  );

  const fetchCommandeById = useCallback(
    async (id) => {
      if (!id || !mama_id) return { data: null, error: null };
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("commandes")
        .select(
          "id, date_commande, statut, fournisseur_id, mama_id, created_at, fournisseur:fournisseurs!commandes_fournisseur_id_fkey(id, nom, email), lignes:commande_lignes(id, commande_id, produit_id, quantite, prix_unitaire, tva, total_ligne, produit:produit_id(id, nom))"
        )
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      setLoading(false);
      if (error) {
        console.error("❌ fetchCommandeById", error.message);
        setError(error);
        setCurrent(null);
        return { data: null, error };
      }
      setCurrent(data);
      return { data, error: null };
    },
    [mama_id]
  );

  async function createCommande({ lignes = [], ...rest }) {
    if (!mama_id) return { error: "mama_id manquant" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.
    from("commandes").
    insert([{ ...rest, mama_id, created_by: user_id }]).
    select().
    single();
    setLoading(false);
    if (error) {
      console.error("❌ createCommande", error.message);
      setError(error);
      return { error };
    }
    if (lignes.length) {
      const toInsert = lignes.map((l) => ({
        ...l,
        commande_id: data.id,
        mama_id
      }));
      const { error: lineErr } = await supabase.
      from("commande_lignes").
      insert(toInsert);
      if (lineErr) console.error("❌ commande lignes", lineErr.message);
    }
    return { data };
  }

  async function updateCommande(id, fields) {
    if (!mama_id) return { error: "mama_id manquant" };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.
    from("commandes").
    update(fields).
    eq("id", id).
    eq("mama_id", mama_id).
    select().
    single();
    setLoading(false);
    if (error) {
      console.error("❌ updateCommande", error.message);
      setError(error);
      return { error };
    }
    return { data };
  }

  async function validateCommande(id) {
    return updateCommande(id, {
      statut: "validée",
      validated_by: user_id,
      envoyee_at: new Date().toISOString()
    });
  }

  async function deleteCommande(id) {
    if (!mama_id) return { error: "mama_id manquant" };
    setLoading(true);
    setError(null);
    const { error } = await supabase.
    from("commandes").
    delete().
    eq("id", id).
    eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      console.error("❌ deleteCommande", error.message);
      setError(error);
      return { error };
    }
    return { data: true };
  }

  return {
    data,
    commandes: data,
    currentCommande: current,
    count,
    loading,
    error,
    fetchCommandes,
    fetchCommandeById,
    createCommande,
    updateCommande,
    validateCommande,
    deleteCommande
  };
}

export default useCommandes;
```

### src/hooks/useTransferts.js

```
// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState, useCallback } from "react";

import { useAuth } from '@/hooks/useAuth';
import usePeriodes from '@/hooks/usePeriodes';

export function useTransferts() {
  const { mama_id, user_id } = useAuth();
  const { checkCurrentPeriode } = usePeriodes();
  const [transferts, setTransferts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransferts = useCallback(
    async (
    {
      debut = "",
      fin = "",
      zone_source_id = "",
      zone_dest_id = "",
      produit_id = ""
    } = {}) =>
    {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      let q = supabase
        .from("transferts")
        .select(
          `id, mama_id, date_transfert, motif, zone_source_id, zone_dest_id, commentaire, created_at,
        zone_source:zones_stock!fk_transferts_zone_source_id ( id, nom ),
        zone_dest:zones_stock!fk_transferts_zone_dest_id   ( id, nom ),
        lignes:transfert_lignes ( id, produit_id, quantite, commentaire, produit:produits ( id, nom ) )`
        )
        .eq("mama_id", mama_id)
        .order("date_transfert", { ascending: false });
      if (debut) q = q.gte("date_transfert", debut);
      if (fin) q = q.lte("date_transfert", fin);
      if (zone_source_id) q = q.eq("zone_source_id", zone_source_id);
      if (zone_dest_id) q = q.eq("zone_dest_id", zone_dest_id);
      if (produit_id) q = q.eq("transfert_lignes.produit_id", produit_id);
      const { data, error } = await q;
      setLoading(false);
      if (error) {
        setError(error);
        return [];
      }
      setTransferts(Array.isArray(data) ? data : []);
      return data || [];
    },
    [mama_id]
  );

  async function createTransfert(header, lignes = []) {
    if (!mama_id) return { error: "no mama_id" };
    const date = header.date_transfert || new Date().toISOString();
    const { error: pErr } = await checkCurrentPeriode(date);
    if (pErr) return { error: pErr };
    setLoading(true);
    setError(null);
    const { data: tr, error } = await supabase.
    from("transferts").
    insert([
    {
      mama_id,
      zone_source_id: header.zone_source_id,
      zone_dest_id: header.zone_dest_id,
      motif: header.motif || "",
      date_transfert: date,
      utilisateur_id: user_id
    }]
    ).
    select().
    single();
    if (error) {
      setError(error);
      setLoading(false);
      return { error };
    }
    const lignesInsert = lignes.map((l) => ({
      mama_id,
      transfert_id: tr.id,
      produit_id: l.produit_id,
      quantite: Number(l.quantite),
      commentaire: l.commentaire || ""
    }));
    const { error: err2 } = await supabase.
    from("transfert_lignes").
    insert(lignesInsert);
    if (err2) {
      setError(err2);
      setLoading(false);
      return { error: err2 };
    }
    setLoading(false);
    setTransferts((t) => [{ ...tr, lignes: lignesInsert }, ...t]);
    return { data: tr };
  }

  const getTransfertById = useCallback(
    async (id) => {
      if (!mama_id || !id) return null;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("transferts")
        .select(
          `id, mama_id, date_transfert, motif, zone_source_id, zone_dest_id, commentaire, created_at,
        zone_source:zones_stock!fk_transferts_zone_source_id ( id, nom ),
        zone_dest:zones_stock!fk_transferts_zone_dest_id   ( id, nom ),
        lignes:transfert_lignes ( id, produit_id, quantite, commentaire, produit:produits ( id, nom ) )`
        )
        .eq("mama_id", mama_id)
        .eq("id", id)
        .single();
      setLoading(false);
      if (error) {
        setError(error);
        return null;
      }
      return data;
    },
    [mama_id]
  );

  return {
    transferts,
    loading,
    error,
    fetchTransferts,
    createTransfert,
    getTransfertById
  };
}

export default useTransferts;

```

### src/hooks/useRequisitions.js

```
// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
// src/hooks/useRequisitions.js

import { useAuth } from '@/hooks/useAuth';

export function useRequisitions() {
  const { mama_id } = useAuth();

  async function fetchRequisitions({ search = "", page = 1, limit = 20 } = {}) {
    if (!mama_id) return { data: [], count: 0 };
    let query = supabase.
    from("v_requisitions").
    select(
      "id, date_requisition, quantite, mama_id, produit_id, produit_nom, photo_url",
      { count: "exact" }
    ).
    eq("mama_id", mama_id).
    order("date_requisition", { ascending: false }).
    range((page - 1) * limit, page * limit - 1);
    if (search) query = query.ilike("produit_nom", `%${search}%`);
    const { data, count, error } = await query;
    if (error) {
      console.error("❌ Erreur fetchRequisitions:", error.message);
      return { data: [], count: 0 };
    }
    return { data: data || [], count: count || 0 };
  }

  async function getRequisitions({
    zone = "",
    statut = "",
    debut = "",
    fin = "",
    produit = "",
    page = 1,
    limit = 10
  } = {}) {
    if (!mama_id) return { data: [], count: 0 };
    let query = supabase.
    from("requisitions").
    select(
      `id, date_requisition, statut, zone_id, mama_id,
      lignes:requisition_lignes ( id, produit_id, unite, quantite )`,
      { count: "exact" }
    ).
    eq("mama_id", mama_id).
    order("date_requisition", { ascending: false }).
    range((page - 1) * limit, page * limit - 1);
    if (zone) query = query.eq("zone_id", zone);
    if (statut) query = query.eq("statut", statut);
    if (debut) query = query.gte("date_requisition", debut);
    if (fin) query = query.lte("date_requisition", fin);
    const { data, count, error } = await query;
    if (error) {
      console.error("❌ Erreur getRequisitions:", error.message);
      return { data: [], count: 0 };
    }
    let rows = data || [];
    if (produit) {
      rows = rows.filter((r) => (r.lignes || []).some((l) => l.produit_id === produit));
    }
    return { data: rows, count: count || 0 };
  }

  async function getRequisitionById(id) {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase.
    from("requisitions").
    select(
      `id, date_requisition, statut, zone_id, mama_id, commentaire,
      lignes:requisition_lignes!requisition_id(
        id, produit_id, unite, quantite, produit:produit_id(id, nom)
      )`
    ).
    eq("id", id).
    eq("mama_id", mama_id).
    single();
    if (error) {
      console.error("❌ Erreur getRequisitionById:", error.message);
      return null;
    }
    return data || null;
  }

  async function createRequisition({
    date_requisition = new Date().toISOString().slice(0, 10),
    zone_id = null,
    commentaire = "",
    statut = "brouillon",
    lignes = []
  }) {
    if (!mama_id || !zone_id) return { error: "mama_id manquant" };
    const { data, error } = await supabase.
    from("requisitions").
    insert([
    {
      date_requisition,
      zone_id,
      commentaire,
      statut,
      actif: true,
      mama_id
    }]
    ).
    select().
    single();
    if (error) {
      console.error("❌ Erreur creation requisition:", error.message);
      return { error };
    }
    const requisition = data;
    if (lignes.length) {
      const toInsert = lignes.map((l) => ({
        requisition_id: requisition.id,
        produit_id: l.produit_id,
        quantite: Number(l.quantite),
        unite: l.unite,
        mama_id
      }));
      const { error: lineErr } = await supabase.from("requisition_lignes").insert(toInsert);
      if (lineErr) console.error("❌ Erreur lignes requisition:", lineErr.message);
    }
    return { data: requisition };
  }

  async function updateRequisition(id, fields) {
    if (!mama_id) return { error: "mama_id manquant" };
    const { data, error } = await supabase.
    from("requisitions").
    update(fields).
    eq("id", id).
    eq("mama_id", mama_id).
    select().
    single();
    if (error) {
      console.error("❌ Erreur update requisition:", error.message);
      return { error };
    }
    return { data };
  }

  async function deleteRequisition(id) {
    if (!mama_id) return { error: "mama_id manquant" };
    const { error } = await supabase.
    from("requisitions").
    delete().
    eq("id", id).
    eq("mama_id", mama_id);
    if (error) {
      console.error("❌ Erreur delete requisition:", error.message);
      return { error };
    }
    return { data: true };
  }

  return {
    fetchRequisitions,
    getRequisitions,
    getRequisitionById,
    createRequisition,
    updateRequisition,
    deleteRequisition,
    refetch: getRequisitions
  };
}

export default useRequisitions;
```

### src/hooks/useProducts.js

```
// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
// src/hooks/useProducts.js
import { useState, useCallback, useEffect } from "react";

import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

function safeQueryClient() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryClient();
  } catch {
    return {
      invalidateQueries: () => {},
      setQueryData: () => {},
      fetchQuery: async () => {}
    };
  }
}

export function useProducts() {
  const { mama_id } = useAuth();
  const queryClient = safeQueryClient();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async ({
    search = "",
    page = 1,
    limit = 100
  } = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error, count } = await supabase
      .from('produits')
      .select(
        `id, nom, mama_id, actif, famille_id, unite_id, code, image,
        pmp, stock_reel, stock_min, stock_theorique, created_at, updated_at,
        unite:unite_id( nom ),
        famille:famille_id( nom )`,
        { count: 'exact' }
      )
      .eq('mama_id', mama_id)
      .ilike('nom', `%${search}%`)
      .order('nom', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const [
      { data: pmpData },
      { data: stockData },
      { data: lastPriceData }
    ] = await Promise.all([
      supabase.from('v_pmp').select('produit_id, pmp').eq('mama_id', mama_id),
      supabase.from('v_stocks').select('produit_id, stock').eq('mama_id', mama_id),
      supabase.from('v_produits_dernier_prix').select('produit_id, dernier_prix').eq('mama_id', mama_id)
    ]);
    const pmpMap = Object.fromEntries((pmpData || []).map((p) => [p.produit_id, p.pmp]));
    const stockMap = Object.fromEntries((stockData || []).map((s) => [s.produit_id, s.stock]));
    const lastPriceMap = Object.fromEntries((lastPriceData || []).map((l) => [l.produit_id, l.dernier_prix]));
    const final = (Array.isArray(data) ? data : []).map((p) => ({
      ...p,
      pmp: pmpMap[p.id] ?? p.pmp,
      dernier_prix: lastPriceMap[p.id] ?? p.dernier_prix,
      stock_theorique: stockMap[p.id] ?? p.stock_theorique
    }));
    setProducts(final);
    setTotal(count || 0);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    return data || [];
  }, [mama_id]);

  useEffect(() => {
    if (!mama_id) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mama_id]);

  async function addProduct(product, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { fournisseur_id, tva, ...rest } = product || {};
    const payload = {
      ...rest,
      tva: tva ?? 0,
      fournisseur_id: fournisseur_id ?? null,
      mama_id
    };
    const { error } = await supabase.from("produits").insert([payload]);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
  }

  async function updateProduct(id, updateFields, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { fournisseur_id, ...rest } = updateFields || {};
    const payload = { ...rest };
    if (fournisseur_id !== undefined) {
      payload.fournisseur_id = fournisseur_id;
    }
    const { error } = await supabase.
    from("produits").
    update(payload).
    eq("id", id).
    eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
  }

  async function toggleProductActive(id, actif, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase.
    from("produits").
    update({ actif }).
    eq("id", id).
    eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
  }

  async function deleteProduct(id, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase.
    from("produits").
    update({ actif: false }).
    eq("id", id).
    eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
  }

  async function duplicateProduct(id, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    const original = products.find((p) => p.id === id);
    if (!original) return { error: "Produit introuvable" };
    setLoading(true);
    setError(null);
    const {
      id: _id,
      pmp,
      stock_theorique,
      stock_reel,
      dernier_prix,
      unite,
      zone_stock,
      famille,
      sous_famille,
      main_fournisseur,
      ...rest
    } = original;
    const payload = { ...rest, nom: `${original.nom} (copie)`, mama_id };
    const { error } = await supabase.from('produits').insert([payload]);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
  }

  const fetchProductPrices = useCallback(async (productId) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.
    from("fournisseur_produits").
    select(
      "*, fournisseur:fournisseurs!fk_fournisseur_produits_fournisseur_id(id, nom), derniere_livraison:date_livraison"
    ).
    eq("produit_id", productId).
    eq("mama_id", mama_id).
    order("date_livraison", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    return data || [];
  }, [mama_id]);

  const fetchProductStock = useCallback(
    async (productId) => {
      if (!mama_id) return null;
      const { data, error } = await supabase.
      from('v_stocks').
      select('stock').
      eq('produit_id', productId).
      eq('mama_id', mama_id).
      single();
      if (error) {
        setError(error);
        toast.error(error.message);
        return null;
      }
      return data?.stock ?? 0;
    },
    [mama_id]
  );

  const fetchProductMouvements = useCallback(
    async (productId) => {
      if (!mama_id) return [];
      const { data, error } = await supabase.
      from('requisition_lignes').
      select('quantite, requisitions!inner(date_requisition, mama_id, statut)').
      eq('produit_id', productId).
      eq('requisitions.mama_id', mama_id).
      eq('requisitions.statut', 'réalisée').
      order('requisitions.date_requisition', { ascending: false });
      if (error) {
        setError(error);
        toast.error(error.message);
        return [];
      }
      return (data || []).map((m) => ({
        date: m.requisitions.date_requisition,
        type: 'sortie',
        quantite: m.quantite
      }));
    },
    [mama_id]
  );

  const getProduct = useCallback(
    async (id) => {
      if (!mama_id) return null;
      const { data, error } = await supabase.
      from("produits").
      select(
        "*, famille:famille_id(nom), sous_famille:sous_familles!fk_produits_sous_famille(nom), main_fournisseur:fournisseur_id(id, nom), unite:unite_id (nom)"
      ).
      eq("id", id).
      eq("mama_id", mama_id).
      single();
      if (error) {
        setError(error);
        toast.error(error.message);
        return null;
      }
      return data;
    },
    [mama_id]
  );

  function exportProductsToExcel() {
    const datas = (products || []).map((p) => ({
      id: p.id,
      nom: p.nom,
      famille: p.famille?.nom || "",
      unite: p.unite?.nom || "",
      code: p.code,
      allergenes: p.allergenes,
      pmp: p.pmp,
      stock_theorique: p.stock_theorique,
      stock_reel: p.stock_reel,
      seuil_min: p.seuil_min,
      dernier_prix: p.dernier_prix,
      fournisseur: p.main_fournisseur?.nom || "",
      fournisseur_id: p.fournisseur_id || "",
      actif: p.actif
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Produits");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "produits_mamastock.xlsx");
  }

  async function importProductsFromExcel(file) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    try {
      const arr = await safeImportXLSX(file, "Produits");
      return arr;
    } catch (error) {
      setError(error);
      toast.error(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    products,
    total,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    toggleProductActive,
    deleteProduct,
    duplicateProduct,
    fetchProductPrices,
    getProduct,
    exportProductsToExcel,
    importProductsFromExcel,
    fetchProductStock,
    fetchProductMouvements
  };
}
```

### src/hooks/_shared/createAsyncState.ts

```
export function createAsyncState<T>(initial: T | null = null) {
  return { data: initial as T | null, loading: false as boolean, error: null as unknown };
}

```

## CHECKS
### .eq('mama_id',) par fichier
src/api/public/produits.js:1
src/api/public/stock.js:1
src/hooks/data/useFactures.js:1
src/hooks/useCostCenterMonthlyStats.js:1
src/hooks/useDashboard.js:1
src/hooks/useEmailsEnvoyes.js:1
src/hooks/useFacturesList.js:1
src/hooks/useFournisseurApiConfig.js:1
src/hooks/useGlobalSearch.js:2
src/hooks/useInvoice.ts:3
src/hooks/useOnboarding.js:1
src/hooks/useProducts.js:4
src/hooks/useReporting.js:4
src/hooks/useSousFamilles.js:1
src/hooks/useValidations.js:2
src/hooks/useZones.js:4
src/pages/Parametres/Familles.jsx:2
src/pages/parametrage/PermissionsAdmin.jsx:1
src/pages/parametrage/PermissionsForm.jsx:2

### zone_depart|zone_arrivee
(aucune occurrence)

### from('v_cost_center_month')
AUDIT_GLOBAL_MAMASTOCK.md:63:- **useReporting** : RPC `consolidated_stats` puis `from('v_achats_mensuels').select('*').eq('mama_id', mama_id)`, `from('v_pmp').select('*').eq('mama_id', mama_id)`, `from('v_analytique_stock').select('famille, sumv:valeur').eq('mama_id', mama_id).group('famille')`, `from('v_cost_center_month').select('*').eq('mama_id', mama_id)`.

### .range((page-1)*limit, page*limit-1)
AUDIT_GLOBAL_MAMASTOCK.md:59:- **useFiches** : `from('fiches_techniques').select("*, famille:familles(id, nom), lignes:fiche_lignes!fiche_id(id)").eq('mama_id', mama_id).order(sortField).range((page-1)*limit, page*limit-1)` avec filtres `ilike`, `eq`.
AUDIT_GLOBAL_MAMASTOCK.md:70:- **useFamilles** : `from('familles').select('id, code, nom, actif', { count:'exact' }).eq('mama_id', mama_id).ilike('nom', "%${search}%").range((page-1)*limit, page*limit-1)`.

### npm run typecheck

> mamastock.com@0.0.0 typecheck
> tsc --noEmit

src/api/public/promotions.js(1,1): error TS1490: File appears to be binary.
src/components/parametrage/SousFamilleList.jsx(1,1): error TS1490: File appears to be binary.
src/hooks/useInvoiceOcr.js(1,1): error TS1490: File appears to be binary.
src/pages/signalements/Signalements.jsx(1,1): error TS1490: File appears to be binary.
src/pages/simulation/SimulationForm.jsx(1,1): error TS1490: File appears to be binary.

### npm run build
dist/assets/MenuEngineering-DTGgRczy.js                 31.58 kB │ gzip:   8.59 kB
dist/assets/Factures-AjTulMWo.js                        48.47 kB │ gzip:  15.76 kB
dist/assets/select-D9Y2yZZ1.js                          53.30 kB │ gzip:  18.86 kB
dist/assets/FactureForm-ruVWu119.js                     77.18 kB │ gzip:  25.14 kB
dist/assets/proxy-uLBKqdPY.js                          112.13 kB │ gzip:  36.92 kB
dist/assets/index.es-D2vJljWt.js                       159.10 kB │ gzip:  53.31 kB
dist/assets/html2canvas.esm-B0tyYwQk.js                202.36 kB │ gzip:  48.04 kB
dist/assets/jspdf.es.min-Cby1fxZb.js                   357.88 kB │ gzip: 117.95 kB
dist/assets/generateCategoricalChart-W9ig6pUm.js       377.21 kB │ gzip: 104.36 kB
dist/assets/xlsx-eYdzo_tC.js                           424.69 kB │ gzip: 141.75 kB
dist/assets/index-CJutE74Z.js                          477.05 kB │ gzip: 146.31 kB
dist/assets/CommandePDF-D_V95B6K.js                  1,330.40 kB │ gzip: 437.41 kB
✓ built in 18.00s

PWA v1.0.2
mode      generateSW
precache  188 entries (4209.59 KiB)
files generated
  dist/service-worker.js
  dist/workbox-5ffe50d4.js

## Actions restantes
- Vérifier les occurrences de from('v_cost_center_month') et pagination dans AUDIT_GLOBAL_MAMASTOCK.md
- Corriger les erreurs de typecheck
