// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-refresh/only-export-components */
import { Suspense, useEffect } from "react";
import lazyWithPreload from "@/lib/lazyWithPreload";
import nprogress from 'nprogress';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import Layout from "@/layout/Layout";
import Login from "@/pages/auth/Login";
import Unauthorized from "@/pages/auth/Unauthorized";
import Pending from "@/pages/auth/Pending";
import Blocked from "@/pages/auth/Blocked";
import OnboardingUtilisateur from "@/pages/onboarding/OnboardingUtilisateur";
import DebugAuth from "@/pages/debug/DebugAuth";
import AccessExample from "@/pages/debug/AccessExample";
import DebugRights from "@/pages/debug/DebugRights";
import PrivateOutlet from "@/router/PrivateOutlet";

const Dashboard = lazyWithPreload(() => import("@/pages/Dashboard.jsx"));
const Fournisseurs = lazyWithPreload(() => import("@/pages/fournisseurs/Fournisseurs.jsx"));
const FournisseurCreate = lazyWithPreload(() => import("@/pages/fournisseurs/FournisseurCreate.jsx"));
const FournisseurDetailPage = lazyWithPreload(() => import("@/pages/fournisseurs/FournisseurDetailPage.jsx"));
const Factures = lazyWithPreload(() => import("@/pages/factures/Factures.jsx"));
const FactureDetail = lazyWithPreload(() => import("@/pages/factures/FactureDetail.jsx"));
const ImportFactures = lazyWithPreload(() => import("@/pages/factures/ImportFactures.jsx"));
const FactureCreate = lazyWithPreload(() => import("@/pages/factures/FactureCreate.jsx"));
const Achats = lazyWithPreload(() => import("@/pages/achats/Achats.jsx"));
const Fiches = lazyWithPreload(() => import("@/pages/fiches/Fiches.jsx"));
const FicheDetail = lazyWithPreload(() => import("@/pages/fiches/FicheDetail.jsx"));
const Carte = lazyWithPreload(() => import("@/pages/carte/Carte.jsx"));
const Menus = lazyWithPreload(() => import("@/pages/menus/Menus.jsx"));
const MenuGroupes = lazyWithPreload(() => import("@/pages/menus/MenuGroupes.jsx"));
const MenuGroupeForm = lazyWithPreload(() => import("@/pages/menus/MenuGroupeForm.jsx"));
const MenuGroupeDetail = lazyWithPreload(() => import("@/pages/menus/MenuGroupeDetail.jsx"));
const MenuDuJourPlanning = lazyWithPreload(() => import("@/pages/menu/MenuDuJour.jsx"));
const MenuDuJourJour = lazyWithPreload(() => import("@/pages/menu/MenuDuJourJour.jsx"));
const Produits = lazyWithPreload(() => import("@/pages/produits/Produits.jsx"));
const ProduitDetail = lazyWithPreload(() => import("@/pages/produits/ProduitDetail.jsx"));
const ProduitForm = lazyWithPreload(() => import("@/pages/produits/ProduitForm.jsx"));
const Inventaire = lazyWithPreload(() => import("@/pages/inventaire/Inventaire.jsx"));
const InventaireForm = lazyWithPreload(() => import("@/pages/inventaire/InventaireForm.jsx"));
const InventaireDetail = lazyWithPreload(() => import("@/pages/inventaire/InventaireDetail.jsx"));
const InventaireZones = lazyWithPreload(() => import("@/pages/inventaire/InventaireZones.jsx"));
const StockTransferts = lazyWithPreload(() => import("@/pages/stock/Transferts.jsx"));
const StockAlertesRupture = lazyWithPreload(() => import("@/pages/stock/AlertesRupture.jsx"));
const Alertes = lazyWithPreload(() => import("@/pages/Alertes.jsx"));
const Taches = lazyWithPreload(() => import("@/pages/taches/Taches.jsx"));
const TacheForm = lazyWithPreload(() => import("@/pages/taches/TacheForm.jsx"));
const TacheDetail = lazyWithPreload(() => import("@/pages/taches/TacheDetail.jsx"));
const AlertesTaches = lazyWithPreload(() => import("@/pages/taches/Alertes.jsx"));
const Promotions = lazyWithPreload(() => import("@/pages/promotions/Promotions.jsx"));
const Documents = lazyWithPreload(() => import("@/pages/documents/Documents.jsx"));
const Analyse = lazyWithPreload(() => import("@/pages/analyse/Analyse.jsx"));
const AnalyseCostCenter = lazyWithPreload(() => import("@/pages/analyse/AnalyseCostCenter.jsx"));
const AnalytiqueDashboard = lazyWithPreload(() => import("@/pages/analytique/AnalytiqueDashboard.jsx"));
const CostingCarte = lazyWithPreload(() => import("@/pages/costing/CostingCarte.jsx"));
const Utilisateurs = lazyWithPreload(() => import("@/pages/parametrage/Utilisateurs.jsx"));
const Mamas = lazyWithPreload(() => import("@/pages/parametrage/Mamas.jsx"));
const Permissions = lazyWithPreload(() => import("@/pages/parametrage/Permissions.jsx"));
const AccessRights = lazyWithPreload(() => import("@/pages/parametrage/AccessRights.jsx"));
const APIKeys = lazyWithPreload(() => import("@/pages/parametrage/APIKeys.jsx"));
const MamaSettingsForm = lazyWithPreload(() => import("@/pages/parametrage/MamaSettingsForm.jsx"));
const Zones = lazyWithPreload(() => import("@/pages/parametrage/Zones.jsx"));
const ZoneForm = lazyWithPreload(() => import("@/pages/parametrage/ZoneForm.jsx"));
const ZoneAccess = lazyWithPreload(() => import("@/pages/parametrage/ZoneAccess.jsx"));
const Familles = lazyWithPreload(() => import("@/pages/Parametres/Familles.jsx"));
const Unites = lazyWithPreload(() => import("@/pages/parametrage/Unites.jsx"));
const Periodes = lazyWithPreload(() => import("@/pages/parametrage/Periodes.jsx"));
const Onboarding = lazyWithPreload(() => import("@/pages/public/Onboarding.jsx"));
const Accueil = lazyWithPreload(() => import("@/pages/Accueil.jsx"));
const Signup = lazyWithPreload(() => import("@/pages/public/Signup.jsx"));
const Rgpd = lazyWithPreload(() => import("@/pages/Rgpd.jsx"));
const Confidentialite = lazyWithPreload(() => import("@/pages/legal/Confidentialite.jsx"));
const MentionsLegales = lazyWithPreload(() => import("@/pages/legal/MentionsLegales.jsx"));
const Cgu = lazyWithPreload(() => import("@/pages/legal/Cgu.jsx"));
const Cgv = lazyWithPreload(() => import("@/pages/legal/Cgv.jsx"));
const Contact = lazyWithPreload(() => import("@/pages/legal/Contact.jsx"));
const Licence = lazyWithPreload(() => import("@/pages/legal/Licence.jsx"));
const AideContextuelle = lazyWithPreload(() => import("@/pages/AideContextuelle.jsx"));
const SupervisionGroupe = lazyWithPreload(() => import("@/pages/supervision/SupervisionGroupe.jsx"));
const ComparateurFiches = lazyWithPreload(() => import("@/pages/supervision/ComparateurFiches.jsx"));
const NotificationsInbox = lazyWithPreload(() => import("@/pages/notifications/NotificationsInbox.jsx"));
const NotificationSettingsForm = lazyWithPreload(() => import("@/pages/notifications/NotificationSettingsForm.jsx"));
const FournisseurApiSettingsForm = lazyWithPreload(() => import("@/pages/fournisseurs/FournisseurApiSettingsForm.jsx"));
const ApiFournisseurs = lazyWithPreload(() => import("@/pages/fournisseurs/ApiFournisseurs.jsx"));
const CatalogueSyncViewer = lazyWithPreload(() => import("@/pages/catalogue/CatalogueSyncViewer.jsx"));
const CommandesEnvoyees = lazyWithPreload(() => import("@/pages/commandes/CommandesEnvoyees.jsx"));
const CommandeForm = lazyWithPreload(() => import("@/pages/commandes/CommandeForm.jsx"));
const CommandeDetail = lazyWithPreload(() => import("@/pages/commandes/CommandeDetail.jsx"));
const EmailsEnvoyes = lazyWithPreload(() => import("@/pages/emails/EmailsEnvoyes.jsx"));
const SimulationPlanner = lazyWithPreload(() => import("@/pages/planning/SimulationPlanner.jsx"));
const Commandes = lazyWithPreload(() => import("@/pages/commandes/Commandes.jsx"));
const Planning = lazyWithPreload(() => import("@/pages/Planning.jsx"));
const PlanningForm = lazyWithPreload(() => import("@/pages/PlanningForm.jsx"));
const PlanningDetail = lazyWithPreload(() => import("@/pages/PlanningDetail.jsx"));
const DashboardBuilder = lazyWithPreload(() => import("@/pages/dashboard/DashboardBuilder.jsx"));
const Reporting = lazyWithPreload(() => import("@/pages/reporting/Reporting.jsx"));
const Consolidation = lazyWithPreload(() => import("@/pages/consolidation/Consolidation.jsx"));
const AccessMultiSites = lazyWithPreload(() => import("@/pages/consolidation/AccessMultiSites.jsx"));
const CreateMama = lazyWithPreload(() => import("@/pages/auth/CreateMama.jsx"));
const Feedback = lazyWithPreload(() => import("@/pages/Feedback.jsx"));
const SupervisionLogs = lazyWithPreload(() => import("@/pages/supervision/Logs.jsx"));
const SupervisionRapports = lazyWithPreload(() => import("@/pages/supervision/Rapports.jsx"));
const Consentements = lazyWithPreload(() => import("@/pages/Consentements.jsx"));
const Requisitions = lazyWithPreload(() => import("@/pages/requisitions/Requisitions.jsx"));
const RequisitionForm = lazyWithPreload(() => import("@/pages/requisitions/RequisitionForm.jsx"));
const RequisitionDetail = lazyWithPreload(() => import("@/pages/requisitions/RequisitionDetail.jsx"));
const Receptions = lazyWithPreload(() => import("@/pages/receptions/Receptions.jsx"));
const BonsLivraison = lazyWithPreload(() => import("@/pages/bons_livraison/BonsLivraison.jsx"));
const BLCreate = lazyWithPreload(() => import("@/pages/bons_livraison/BLCreate.jsx"));
const BLDetail = lazyWithPreload(() => import("@/pages/bons_livraison/BLDetail.jsx"));
const Recettes = lazyWithPreload(() => import("@/pages/recettes/Recettes.jsx"));
const Surcouts = lazyWithPreload(() => import("@/pages/surcouts/Surcouts.jsx"));
const TableauxDeBord = lazyWithPreload(() => import("@/pages/analyse/TableauxDeBord.jsx"));
const Comparatif = lazyWithPreload(() => import("@/pages/fournisseurs/comparatif/ComparatifPrix.jsx"));
const MenuEngineering = lazyWithPreload(() => import("@/pages/engineering/MenuEngineering.jsx"));
const EngineeringMenu = lazyWithPreload(() => import("@/pages/EngineeringMenu.jsx"));
const Logout = lazyWithPreload(() => import("@/pages/auth/Logout.jsx"));
const Stats = lazyWithPreload(() => import("@/pages/stats/Stats.jsx"));
const Roles = lazyWithPreload(() => import("@/pages/parametrage/Roles.jsx"));
const PlanningModule = lazyWithPreload(() => import("@/pages/PlanningModule.jsx"));

export const routePreloadMap = {
  '/dashboard': Dashboard.preload,
  '/produits': Produits.preload,
  '/inventaire': Inventaire.preload,
  '/fournisseurs': Fournisseurs.preload,
  '/factures': Factures.preload,
  '/factures/import': ImportFactures.preload,
  '/achats': Achats.preload,
  '/receptions': Receptions.preload,
  '/bons-livraison': BonsLivraison.preload,
  '/documents': Documents.preload,
  '/notifications': NotificationsInbox.preload,
  '/emails/envoyes': EmailsEnvoyes.preload,
  '/commandes': Commandes.preload,
  '/commandes/envoyees': CommandesEnvoyees.preload,
  '/commandes/nouvelle': CommandeForm.preload,
  '/commandes/:id': CommandeDetail.preload,
  '/planning': Planning.preload,
  '/planning/simulation': SimulationPlanner.preload,
  '/taches': Taches.preload,
  '/taches/new': TacheForm.preload,
  '/taches/:id': TacheDetail.preload,
  '/taches/alertes': AlertesTaches.preload,
  '/promotions': Promotions.preload,
  '/fiches': Fiches.preload,
  '/menus': Menus.preload,
  '/menu': MenuDuJourPlanning.preload,
  '/menu/:date': MenuDuJourJour.preload,
  '/menu-groupes': MenuGroupes.preload,
  '/menu-groupes/nouveau': MenuGroupeForm.preload,
  '/menu-groupes/:id': MenuGroupeDetail.preload,
  '/carte': Carte.preload,
  '/recettes': Recettes.preload,
  '/requisitions': Requisitions.preload,
  '/consolidation': Consolidation.preload,
  '/admin/access-multi-sites': AccessMultiSites.preload,
  '/reporting': Reporting.preload,
  '/tableaux-de-bord': TableauxDeBord.preload,
  '/comparatif': Comparatif.preload,
  '/surcouts': Surcouts.preload,
  '/costing/carte': CostingCarte.preload,
  '/stock/alertes': StockAlertesRupture.preload,
  '/alertes': Alertes.preload,
  '/parametrage/utilisateurs': Utilisateurs.preload,
  '/parametrage/mamas': Mamas.preload,
  '/parametrage/permissions': Permissions.preload,
  '/parametrage/access': AccessRights.preload,
  '/parametrage/api-keys': APIKeys.preload,
  '/parametrage/api-fournisseurs': ApiFournisseurs.preload,
  '/parametrage/settings': MamaSettingsForm.preload,
  '/parametrage/zones': Zones.preload,
  '/parametrage/zones/:id': ZoneForm.preload,
  '/parametrage/zones/:id/droits': ZoneAccess.preload,
  '/parametrage/familles': Familles.preload,
  '/parametrage/unites': Unites.preload,
  '/parametrage/periodes': Periodes.preload,
  '/consentements': Consentements.preload,
  '/supervision': SupervisionGroupe.preload,
  '/supervision/comparateur': ComparateurFiches.preload,
  '/supervision/logs': SupervisionLogs.preload,
  '/supervision/rapports': SupervisionRapports.preload,
  '/aide': AideContextuelle.preload,
  '/feedback': Feedback.preload,
  '/stats': Stats.preload,
  '/planning-module': PlanningModule.preload,
  '/parametrage/roles': Roles.preload,
};


function RootRoute() {
  const location = useLocation();
  const { session, userData, loading } = useAuth();

  if (loading || (session && !userData)) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (userData?.actif === false) return <Navigate to="/blocked" replace />;

  return <Navigate to="/dashboard" replace />;
}

export default function Router() {
  const location = useLocation();
  useEffect(() => {
    nprogress.start();
    return () => {
      nprogress.done();
    };
  }, [location.pathname]);
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/accueil" element={<Accueil />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/create-mama" element={<CreateMama />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/blocked" element={<Blocked />} />
        <Route path="/onboarding-utilisateur" element={<OnboardingUtilisateur />} />
        <Route path="/rgpd" element={<Rgpd />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/cgu" element={<Cgu />} />
        <Route path="/cgv" element={<Cgv />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/licence" element={<Licence />} />
        <Route path="/debug/auth" element={<DebugAuth />} />
        <Route path="/debug/rights" element={<DebugRights />} />
        {/* Routes internes protégées par les droits utilisateurs */}
        <Route element={<PrivateOutlet />}>
          <Route path="/" element={<Layout />}>
          <Route
            path="dashboard"
            element={<Dashboard />}
          />
          <Route
            path="/dashboard/builder"
            element={<DashboardBuilder />}
          />
          <Route
            path="/fournisseurs"
            element={<Fournisseurs />}
          />
          <Route
            path="/fournisseurs/nouveau"
            element={<FournisseurCreate />}
          />
          <Route
            path="/fournisseurs/:id"
            element={<FournisseurDetailPage />}
          />
          <Route
            path="/fournisseurs/:id/api"
            element={<FournisseurApiSettingsForm />}
          />
          <Route
            path="/factures"
            element={<Factures />}
          />
          <Route
            path="/factures/nouveau"
            element={<FactureCreate />}
          />
          <Route
            path="/factures/:id"
            element={<FactureDetail />}
          />
          <Route
            path="/factures/import"
            element={<ImportFactures />}
          />
          <Route
          path="/receptions"
          element={<Receptions />}
        />
        <Route
          path="/achats"
          element={<Achats />}
        />
        <Route
          path="/bons-livraison"
          element={<BonsLivraison />}
        />
          <Route
            path="/bons-livraison/nouveau"
            element={<BLCreate />}
          />
          <Route
            path="/bons-livraison/:id"
            element={<BLDetail />}
          />
          <Route
            path="/fiches"
            element={<Fiches />}
          />
          <Route
            path="/fiches/:id"
            element={<FicheDetail />}
          />
          <Route
            path="/menus"
            element={<Menus />}
          />
          <Route
            path="/menu"
            element={<MenuDuJourPlanning />}
          />
          <Route
            path="/menu/:date"
            element={<MenuDuJourJour />}
          />
          <Route
            path="/menu-groupes"
            element={<MenuGroupes />}
          />
          <Route
            path="/menu-groupes/nouveau"
            element={<MenuGroupeForm />}
          />
          <Route
            path="/menu-groupes/:id"
            element={<MenuGroupeDetail />}
          />
          <Route
            path="/carte"
            element={<Carte />}
          />
          <Route
            path="/recettes"
            element={<Recettes />}
          />
          <Route
            path="/requisitions"
            element={<Requisitions />}
          />
          <Route
            path="/requisitions/nouvelle"
            element={<RequisitionForm />}
          />
          <Route
            path="/requisitions/:id"
            element={<RequisitionDetail />}
          />
          <Route
            path="/produits"
            element={<Produits />}
          />
          <Route
            path="/produits/nouveau"
            element={<ProduitForm />}
          />
          <Route
            path="/produits/:id"
            element={<ProduitDetail />}
          />
          <Route
            path="/inventaire"
            element={<Inventaire />}
          />
          <Route
            path="/inventaire/zones"
            element={<InventaireZones />}
          />
          <Route
            path="/inventaire/new"
            element={<InventaireForm />}
          />
          <Route
            path="/inventaire/:id"
            element={<InventaireDetail />}
          />
          <Route
            path="/transferts"
            element={<StockTransferts />}
          />
          <Route
            path="/stock/alertes"
            element={<StockAlertesRupture />}
          />
          <Route
            path="/taches"
            element={<Taches />}
          />
          <Route
            path="/taches/new"
            element={<TacheForm />}
          />
          <Route
            path="/taches/:id"
            element={<TacheDetail />}
          />
          <Route
            path="/taches/alertes"
            element={<AlertesTaches />}
          />
          <Route
            path="/alertes"
            element={<Alertes />}
          />
          <Route
            path="/promotions"
            element={<Promotions />}
          />
          <Route
            path="/notifications"
            element={<NotificationsInbox />}
          />
          <Route
            path="/notifications/settings"
            element={<NotificationSettingsForm />}
          />
          <Route
            path="/documents"
            element={<Documents />}
          />
          <Route
            path="/catalogue/sync"
            element={<CatalogueSyncViewer />}
          />
          <Route
            path="/commandes"
            element={<Commandes />}
          />
          <Route
            path="/commandes/envoyees"
            element={<CommandesEnvoyees />}
          />
          <Route
            path="/commandes/nouvelle"
            element={<CommandeForm />}
          />
          <Route
            path="/commandes/:id"
            element={<CommandeDetail />}
          />
          <Route
            path="/emails/envoyes"
            element={<EmailsEnvoyes />}
          />
          <Route
            path="/planning"
            element={<Planning />}
          />
          <Route
            path="/planning/nouveau"
            element={<PlanningForm />}
          />
          <Route
            path="/planning/:id"
            element={<PlanningDetail />}
          />
          <Route
            path="/planning/simulation"
            element={<SimulationPlanner />}
          />
          <Route
            path="/analyse"
            element={<Analyse />}
          />
          <Route
            path="/analyse/cost-centers"
            element={<AnalyseCostCenter />}
          />
          <Route
            path="/costing/carte"
            element={<CostingCarte />}
          />
          <Route
            path="/analyse/analytique"
            element={<AnalytiqueDashboard />}
          />
          <Route
            path="/menu-engineering"
            element={<MenuEngineering />}
          />
          <Route path="/engineering" element={<EngineeringMenu />} />
          <Route
            path="/tableaux-de-bord"
            element={<TableauxDeBord />}
          />
          <Route
            path="/comparatif"
            element={<Comparatif />}
          />
          <Route
            path="/surcouts"
            element={<Surcouts />}
          />
          <Route
            path="/reporting"
            element={<Reporting />}
          />
          <Route
            path="/consolidation"
            element={<Consolidation />}
          />
          <Route
            path="/admin/access-multi-sites"
            element={<AccessMultiSites />}
          />
          <Route
            path="/parametrage/utilisateurs"
            element={<Utilisateurs />}
          />
          <Route
            path="/parametrage/mamas"
            element={<Mamas />}
          />
          <Route
            path="/parametrage/permissions"
            element={<Permissions />}
          />
          <Route
            path="/parametrage/api-keys"
            element={<APIKeys />}
          />
          <Route
            path="/parametrage/api-fournisseurs"
            element={<ApiFournisseurs />}
          />
          <Route
            path="/parametrage/settings"
            element={<MamaSettingsForm />}
          />
          <Route
            path="/parametrage/zones"
            element={<Zones />}
          />
          <Route
            path="/parametrage/zones/:id"
            element={<ZoneForm />}
          />
          <Route
            path="/parametrage/zones/:id/droits"
            element={<ZoneAccess />}
          />
          <Route
            path="/parametrage/familles"
            element={<Familles />}
          />
          <Route
            path="/parametrage/unites"
            element={<Unites />}
          />
          <Route
            path="/parametrage/periodes"
            element={<Periodes />}
          />
          <Route
            path="/parametrage/access"
            element={<AccessRights />}
          />
          <Route
            path="/consentements"
            element={<Consentements />}
          />
          <Route
            path="/aide"
            element={<AideContextuelle />}
          />
          <Route
            path="/feedback"
            element={<Feedback />}
          />
          <Route
            path="/stats"
            element={<Stats />}
          />
          <Route
            path="/planning-module"
            element={<PlanningModule />}
          />
          <Route
            path="/parametrage/roles"
            element={<Roles />}
          />
          <Route
            path="/supervision"
            element={<SupervisionGroupe />}
          />
          <Route
            path="/supervision/comparateur"
            element={<ComparateurFiches />}
          />
          <Route
            path="/supervision/logs"
            element={<SupervisionLogs />}
          />
          <Route
            path="/supervision/rapports"
            element={<SupervisionRapports />}
          />
          <Route
            path="/debug/access"
            element={<AccessExample />}
          />
        </Route>
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

/* eslint-enable react-refresh/only-export-components */
