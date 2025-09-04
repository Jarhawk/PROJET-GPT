# Uniformisation des imports Supabase

## Contexte
Pour éviter les variations d'instanciation du client, tous les modules du front doivent consommer une instance unique de Supabase.

## Règles appliquées
- utilisation obligatoire de `import supabase from '@/lib/supabase'`
- suppression de tout import direct de `@supabase/supabase-js` hors de `src/lib/supabase.js`
- interdiction des chemins relatifs vers `lib/supabase`
- renommage systématique de l'identifiant local en `supabase`
- ajout de règles ESLint pour prévenir ces régressions

## Fichiers modifiés
- src/components/factures/SupplierPicker.jsx
- src/components/parametrage/UtilisateurRow.jsx
- src/components/produits/ModalImportProduits.jsx
- src/context/HelpProvider.jsx
- src/context/MultiMamaContext.jsx
- src/contexts/AuthContext.jsx
- src/hooks/data/useFactures.js
- src/hooks/data/useFournisseurs.js
- src/hooks/gadgets/useAchatsMensuels.js
- src/hooks/gadgets/useAlerteStockFaible.js
- src/hooks/gadgets/useBudgetMensuel.js
- src/hooks/gadgets/useConsoMoyenne.js
- src/hooks/gadgets/useDerniersAcces.js
- src/hooks/gadgets/useEvolutionAchats.js
- src/hooks/gadgets/useProduitsUtilises.js
- src/hooks/gadgets/useTachesUrgentes.js
- src/hooks/gadgets/useTopFournisseurs.js
- src/hooks/useAchats.js
- src/hooks/useAdvancedStats.js
- src/hooks/useAide.js
- src/hooks/useAlerteStockFaible.js
- src/hooks/useAlerts.js
- src/hooks/useAnalyse.js
- src/hooks/useAnalytique.js
- src/hooks/useApiKeys.js
- src/hooks/useAuditLog.js
- src/hooks/useBonsLivraison.js
- src/hooks/useCarte.js
- src/hooks/useCommandes.js
- src/hooks/useComparatif.js
- src/hooks/useConsentements.js
- src/hooks/useConsolidatedStats.js
- src/hooks/useConsolidation.js
- src/hooks/useCostCenterMonthlyStats.js
- src/hooks/useCostCenterStats.js
- src/hooks/useCostCenterSuggestions.js
- src/hooks/useCostCenters.js
- src/hooks/useCostingCarte.js
- src/hooks/useDashboard.js
- src/hooks/useDashboardStats.js
- src/hooks/useDashboards.js
- src/hooks/useDocuments.js
- src/hooks/useEcartsInventaire.js
- src/hooks/useEmailsEnvoyes.js
- src/hooks/useEnrichedProducts.js
- src/hooks/useExport.js
- src/hooks/useExportCompta.js
- src/hooks/useFactures.js
- src/hooks/useFacturesAutocomplete.js
- src/hooks/useFacturesList.js
- src/hooks/useFamilles.js
- src/hooks/useFamillesWithSousFamilles.js
- src/hooks/useFeedback.js
- src/hooks/useFicheCoutHistory.js
- src/hooks/useFiches.js
- src/hooks/useFichesAutocomplete.js
- src/hooks/useFichesTechniques.js
- src/hooks/useFournisseurAPI.js
- src/hooks/useFournisseurApiConfig.js
- src/hooks/useFournisseurNotes.js
- src/hooks/useFournisseurStats.js
- src/hooks/useFournisseurs.js
- src/hooks/useFournisseursAutocomplete.js
- src/hooks/useFournisseursBrowse.js
- src/hooks/useFournisseursInactifs.js
- src/hooks/useFournisseursRecents.js
- src/hooks/useGadgets.js
- src/hooks/useGlobalSearch.js
- src/hooks/useGraphiquesMultiZone.js
- src/hooks/useHelpArticles.js
- src/hooks/useInventaireLignes.js
- src/hooks/useInventaireZones.js
- src/hooks/useInventaires.js
- src/hooks/useInvoice.ts
- src/hooks/useInvoiceImport.js
- src/hooks/useInvoiceItems.js
- src/hooks/useInvoices.js
- src/hooks/useLogs.js
- src/hooks/useMama.js
- src/hooks/useMamaSettings.js
- src/hooks/useMamas.js
- src/hooks/useMenuDuJour.js
- src/hooks/useMenuEngineering.js
- src/hooks/useMenus.js
- src/hooks/useMouvementCostCenters.js
- src/hooks/useNotifications.js
- src/hooks/usePerformanceFiches.js
- src/hooks/usePeriodes.js
- src/hooks/usePermissions.js
- src/hooks/usePertes.js
- src/hooks/usePlanning.js
- src/hooks/usePriceTrends.js
- src/hooks/useProducts.js
- src/hooks/useProduitLineDefaults.js
- src/hooks/useProduitsAutocomplete.js
- src/hooks/useProduitsFournisseur.js
- src/hooks/useProduitsInventaire.js
- src/hooks/useProduitsSearch.js
- src/hooks/usePromotions.js
- src/hooks/useRGPD.js
- src/hooks/useRecommendations.js
- src/hooks/useReporting.js
- src/hooks/useRequisitions.js
- src/hooks/useRoles.js
- src/hooks/useRuptureAlerts.js
- src/hooks/useSignalements.js
- src/hooks/useSimulation.js
- src/hooks/useSousFamilles.js
- src/hooks/useStats.js
- src/hooks/useStock.js
- src/hooks/useStockRequisitionne.js
- src/hooks/useStorage.js
- src/hooks/useTacheAssignation.js
- src/hooks/useTaches.js
- src/hooks/useTasks.js
- src/hooks/useTemplatesCommandes.js
- src/hooks/useTopProducts.js
- src/hooks/useTransferts.js
- src/hooks/useTwoFactorAuth.js
- src/hooks/useUnites.js
- src/hooks/useUsageStats.js
- src/hooks/useUtilisateurs.js
- src/hooks/useZoneProducts.js
- src/hooks/useZoneRights.js
- src/hooks/useZonesStock.js
- src/layout/Layout.jsx
- src/lib/loginUser.js
- src/lib/supabase.js
- src/pages/BarManager.jsx
- src/pages/CartePlats.jsx
- src/pages/Parametres/Familles.jsx
- src/pages/Transferts.jsx
- src/pages/auth/CreateMama.jsx
- src/pages/auth/Login.jsx
- src/pages/auth/ResetPassword.jsx
- src/pages/auth/UpdatePassword.jsx
- src/pages/catalogue/CatalogueSyncViewer.jsx
- src/pages/commandes/CommandeDetail.jsx
- src/pages/commandes/CommandesEnvoyees.jsx
- src/pages/consolidation/AccessMultiSites.jsx
- src/pages/costboisson/CostBoisson.jsx
- src/pages/emails/EmailsEnvoyes.jsx
- src/pages/factures/FactureDetail.jsx
- src/pages/factures/FactureForm.jsx
- src/pages/fournisseurs/FournisseurDetail.jsx
- src/pages/fournisseurs/comparatif/ComparatifPrix.jsx
- src/pages/inventaire/EcartInventaire.jsx
- src/pages/legal/Confidentialite.jsx
- src/pages/legal/MentionsLegales.jsx
- src/pages/menus/MenuPDF.jsx
- src/pages/mobile/MobileInventaire.jsx
- src/pages/mobile/MobileRequisition.jsx
- src/pages/parametrage/CentreCoutForm.jsx
- src/pages/parametrage/InvitationsEnAttente.jsx
- src/pages/parametrage/InviteUser.jsx
- src/pages/parametrage/MamaForm.jsx
- src/pages/parametrage/Mamas.jsx
- src/pages/parametrage/ParametresCommandes.jsx
- src/pages/parametrage/Permissions.jsx
- src/pages/parametrage/PermissionsAdmin.jsx
- src/pages/parametrage/PermissionsForm.jsx
- src/pages/parametrage/RGPDConsentForm.jsx
- src/pages/parametrage/TemplateCommandeForm.jsx
- src/pages/parametrage/Utilisateurs.jsx
- src/pages/parametrage/Zones.jsx
- src/pages/stats/StatsFiches.jsx
- src/pages/supervision/ComparateurFiches.jsx
- src/pages/supervision/GroupeParamForm.jsx
- src/pages/supervision/Rapports.jsx
- src/pages/supervision/SupervisionGroupe.jsx
- src/pages/taches/Alertes.jsx
- src/utils/exportExcelProduits.js
- src/utils/importExcelProduits.js

## Exemples
Avant :
```js
import { supabase } from '@/lib/supabase'
```
Après :
```js
import supabase from '@/lib/supabase'
```

## Métriques
- 172 fichiers front mis à jour
- 0 import direct de `@supabase/supabase-js` restant (hors `src/lib/supabase.js`)
