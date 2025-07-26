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
import useAuth from "@/hooks/useAuth"; // ✅ Correction Codex
import Layout from "@/layout/Layout";
import Login from "@/pages/auth/Login";
import Unauthorized from "@/pages/auth/Unauthorized";
import Pending from "@/pages/auth/Pending";
import Blocked from "@/pages/auth/Blocked";
import AuthDebug from "@/pages/debug/AuthDebug";
import AccessExample from "@/pages/debug/AccessExample";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

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
const Produits = lazyWithPreload(() => import("@/pages/produits/Produits.jsx"));
const ProduitDetail = lazyWithPreload(() => import("@/pages/produits/ProduitDetail.jsx"));
const ProduitForm = lazyWithPreload(() => import("@/pages/produits/ProduitForm.jsx"));
const Inventaire = lazyWithPreload(() => import("@/pages/inventaire/Inventaire.jsx"));
const InventaireForm = lazyWithPreload(() => import("@/pages/inventaire/InventaireForm.jsx"));
const InventaireDetail = lazyWithPreload(() => import("@/pages/inventaire/InventaireDetail.jsx"));
const InventaireZones = lazyWithPreload(() => import("@/pages/inventaire/InventaireZones.jsx"));
const Mouvements = lazyWithPreload(() => import("@/pages/mouvements/Mouvements.jsx"));
const StockTransferts = lazyWithPreload(() => import("@/pages/stock/Transferts.jsx"));
const Alertes = lazyWithPreload(() => import("@/pages/Alertes.jsx"));
const Taches = lazyWithPreload(() => import("@/pages/taches/Taches.jsx"));
const TacheForm = lazyWithPreload(() => import("@/pages/taches/TacheForm.jsx"));
const AlertesTaches = lazyWithPreload(() => import("@/pages/taches/Alertes.jsx"));
const Promotions = lazyWithPreload(() => import("@/pages/promotions/Promotions.jsx"));
const Documents = lazyWithPreload(() => import("@/pages/documents/Documents.jsx"));
const Analyse = lazyWithPreload(() => import("@/pages/analyse/Analyse.jsx"));
const AnalyseCostCenter = lazyWithPreload(() => import("@/pages/analyse/AnalyseCostCenter.jsx"));
const AnalytiqueDashboard = lazyWithPreload(() => import("@/pages/analytique/AnalytiqueDashboard.jsx"));
const Utilisateurs = lazyWithPreload(() => import("@/pages/parametrage/Utilisateurs.jsx"));
const Mamas = lazyWithPreload(() => import("@/pages/parametrage/Mamas.jsx"));
const Permissions = lazyWithPreload(() => import("@/pages/parametrage/Permissions.jsx"));
const AccessRights = lazyWithPreload(() => import("@/pages/parametrage/AccessRights.jsx"));
const APIKeys = lazyWithPreload(() => import("@/pages/parametrage/APIKeys.jsx"));
const MamaSettingsForm = lazyWithPreload(() => import("@/pages/parametrage/MamaSettingsForm.jsx"));
const Zones = lazyWithPreload(() => import("@/pages/parametrage/Zones.jsx"));
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
const SimulationPlanner = lazyWithPreload(() => import("@/pages/planning/SimulationPlanner.jsx"));
const Commandes = lazyWithPreload(() => import("@/pages/commandes/Commandes.jsx"));
const Planning = lazyWithPreload(() => import("@/pages/Planning.jsx"));
const PlanningForm = lazyWithPreload(() => import("@/pages/PlanningForm.jsx"));
const PlanningDetail = lazyWithPreload(() => import("@/pages/PlanningDetail.jsx"));
const DashboardBuilder = lazyWithPreload(() => import("@/pages/dashboard/DashboardBuilder.jsx"));
const Reporting = lazyWithPreload(() => import("@/pages/reporting/Reporting.jsx"));
const Consolidation = lazyWithPreload(() => import("@/pages/Consolidation.jsx"));
const CreateMama = lazyWithPreload(() => import("@/pages/auth/CreateMama.jsx"));
const Feedback = lazyWithPreload(() => import("@/pages/Feedback.jsx"));
const AuditTrail = lazyWithPreload(() => import("@/pages/AuditTrail.jsx"));
const Logs = lazyWithPreload(() => import("@/pages/Logs.jsx"));
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
const MenuEngineering = lazyWithPreload(() => import("@/pages/MenuEngineering.jsx"));
const EngineeringMenu = lazyWithPreload(() => import("@/pages/EngineeringMenu.jsx"));
const Logout = lazyWithPreload(() => import("@/pages/auth/Logout.jsx"));
const Stats = lazyWithPreload(() => import("@/pages/stats/Stats.jsx"));
const Licences = lazyWithPreload(() => import("@/pages/Licences.jsx"));
const Roles = lazyWithPreload(() => import("@/pages/parametrage/Roles.jsx"));
const PlanningModule = lazyWithPreload(() => import("@/pages/PlanningModule.jsx"));

export const routePreloadMap = {
  '/dashboard': Dashboard.preload,
  '/produits': Produits.preload,
  '/inventaire': Inventaire.preload,
  '/mouvements': Mouvements.preload,
  '/fournisseurs': Fournisseurs.preload,
  '/factures': Factures.preload,
  '/factures/import': ImportFactures.preload,
  '/achats': Achats.preload,
  '/receptions': Receptions.preload,
  '/bons-livraison': BonsLivraison.preload,
  '/documents': Documents.preload,
  '/notifications': NotificationsInbox.preload,
  '/planning': Planning.preload,
  '/planning/simulation': SimulationPlanner.preload,
  '/taches': Taches.preload,
  '/taches/alertes': AlertesTaches.preload,
  '/promotions': Promotions.preload,
  '/fiches': Fiches.preload,
  '/menus': Menus.preload,
  '/carte': Carte.preload,
  '/recettes': Recettes.preload,
  '/requisitions': Requisitions.preload,
  '/consolidation': Consolidation.preload,
  '/reporting': Reporting.preload,
  '/tableaux-de-bord': TableauxDeBord.preload,
  '/comparatif': Comparatif.preload,
  '/surcouts': Surcouts.preload,
  '/alertes': Alertes.preload,
  '/parametrage/utilisateurs': Utilisateurs.preload,
  '/parametrage/mamas': Mamas.preload,
  '/parametrage/permissions': Permissions.preload,
  '/parametrage/access': AccessRights.preload,
  '/parametrage/api-keys': APIKeys.preload,
  '/parametrage/api-fournisseurs': ApiFournisseurs.preload,
  '/parametrage/settings': MamaSettingsForm.preload,
  '/parametrage/zones-stock': Zones.preload,
  '/consentements': Consentements.preload,
  '/audit': AuditTrail.preload,
  '/logs': Logs.preload,
  '/aide': AideContextuelle.preload,
  '/feedback': Feedback.preload,
  '/stats': Stats.preload,
  '/planning-module': PlanningModule.preload,
  '/parametrage/roles': Roles.preload,
  '/licences': Licences.preload,
};


function RootRoute() {
  const { session, loading, pending, userData, error } = useAuth();
  if (loading || pending) return <LoadingSpinner message="Chargement..." />;
  if (error) {
    console.error('Auth error', error); // ✅ Correction Codex
    return <Navigate to="/login" replace />;
  }
  if (session && session.user && userData && userData.actif !== false) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/accueil" replace />;
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
        <Route path="/rgpd" element={<Rgpd />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/cgu" element={<Cgu />} />
        <Route path="/cgv" element={<Cgv />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/licence" element={<Licence />} />
        {/* Routes internes protégées par les droits utilisateurs.
            Chaque sous-route est enveloppée dans <ProtectedRoute accessKey="...">.
            La clé correspond au module autorisé dans access_rights. */}
        <Route path="/" element={<Layout />}>
          <Route
            path="dashboard"
            element={
              <ProtectedRoute accessKey="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/builder"
            element={<ProtectedRoute accessKey="dashboard"><DashboardBuilder /></ProtectedRoute>}
          />
          <Route
            path="/fournisseurs"
            element={<ProtectedRoute accessKey="fournisseurs"><Fournisseurs /></ProtectedRoute>}
          />
          <Route
            path="/fournisseurs/nouveau"
            element={<ProtectedRoute accessKey="fournisseurs"><FournisseurCreate /></ProtectedRoute>}
          />
          <Route
            path="/fournisseurs/:id"
            element={<ProtectedRoute accessKey="fournisseurs"><FournisseurDetailPage /></ProtectedRoute>}
          />
          <Route
            path="/fournisseurs/:id/api"
            element={<ProtectedRoute accessKey="fournisseurs"><FournisseurApiSettingsForm /></ProtectedRoute>}
          />
          <Route
            path="/factures"
            element={<ProtectedRoute accessKey="factures"><Factures /></ProtectedRoute>}
          />
          <Route
            path="/factures/nouveau"
            element={<ProtectedRoute accessKey="factures"><FactureCreate /></ProtectedRoute>}
          />
          <Route
            path="/factures/:id"
            element={<ProtectedRoute accessKey="factures"><FactureDetail /></ProtectedRoute>}
          />
          <Route
            path="/factures/import"
            element={<ProtectedRoute accessKey="factures"><ImportFactures /></ProtectedRoute>}
          />
          <Route
          path="/receptions"
          element={<ProtectedRoute accessKey="receptions"><Receptions /></ProtectedRoute>}
        />
        <Route
          path="/achats"
          element={<ProtectedRoute accessKey="achats"><Achats /></ProtectedRoute>}
        />
        <Route
          path="/bons-livraison"
          element={<ProtectedRoute accessKey="bons_livraison"><BonsLivraison /></ProtectedRoute>}
        />
          <Route
            path="/bons-livraison/nouveau"
            element={<ProtectedRoute accessKey="bons_livraison"><BLCreate /></ProtectedRoute>}
          />
          <Route
            path="/bons-livraison/:id"
            element={<ProtectedRoute accessKey="bons_livraison"><BLDetail /></ProtectedRoute>}
          />
          <Route
            path="/fiches"
            element={<ProtectedRoute accessKey="fiches_techniques"><Fiches /></ProtectedRoute>}
          />
          <Route
            path="/fiches/:id"
            element={<ProtectedRoute accessKey="fiches_techniques"><FicheDetail /></ProtectedRoute>}
          />
          <Route
            path="/menus"
            element={<ProtectedRoute accessKey="menus"><Menus /></ProtectedRoute>}
          />
          <Route
            path="/carte"
            element={<ProtectedRoute accessKey="carte"><Carte /></ProtectedRoute>}
          />
          <Route
            path="/recettes"
            element={<ProtectedRoute accessKey="recettes"><Recettes /></ProtectedRoute>}
          />
          <Route
            path="/requisitions"
            element={<ProtectedRoute accessKey="requisitions"><Requisitions /></ProtectedRoute>}
          />
          <Route
            path="/requisitions/nouvelle"
            element={<ProtectedRoute accessKey="requisitions"><RequisitionForm /></ProtectedRoute>}
          />
          <Route
            path="/requisitions/:id"
            element={<ProtectedRoute accessKey="requisitions"><RequisitionDetail /></ProtectedRoute>}
          />
          <Route
            path="/produits"
            element={<ProtectedRoute accessKey="produits"><Produits /></ProtectedRoute>}
          />
          <Route
            path="/produits/nouveau"
            element={<ProtectedRoute accessKey="produits"><ProduitForm /></ProtectedRoute>}
          />
          <Route
            path="/produits/:id"
            element={<ProtectedRoute accessKey="produits"><ProduitDetail /></ProtectedRoute>}
          />
          <Route
            path="/inventaire"
            element={<ProtectedRoute accessKey="inventaires"><Inventaire /></ProtectedRoute>}
          />
          <Route
            path="/inventaire/zones"
            element={<ProtectedRoute accessKey="inventaires"><InventaireZones /></ProtectedRoute>}
          />
          <Route
            path="/inventaire/new"
            element={<ProtectedRoute accessKey="inventaires"><InventaireForm /></ProtectedRoute>}
          />
          <Route
            path="/inventaire/:id"
            element={<ProtectedRoute accessKey="inventaires"><InventaireDetail /></ProtectedRoute>}
          />
          <Route
            path="/mouvements"
            element={<ProtectedRoute accessKey="mouvements"><Mouvements /></ProtectedRoute>}
          />
          <Route
            path="/transferts"
            element={<ProtectedRoute accessKey="mouvements"><StockTransferts /></ProtectedRoute>}
          />
          <Route
            path="/taches"
            element={<ProtectedRoute accessKey="taches"><Taches /></ProtectedRoute>}
          />
          <Route
            path="/taches/new"
            element={<ProtectedRoute accessKey="taches"><TacheForm /></ProtectedRoute>}
          />
          <Route
            path="/taches/alertes"
            element={<ProtectedRoute accessKey="alertes"><AlertesTaches /></ProtectedRoute>}
          />
          <Route
            path="/alertes"
            element={<ProtectedRoute accessKey="alertes"><Alertes /></ProtectedRoute>}
          />
          <Route
            path="/promotions"
            element={<ProtectedRoute accessKey="promotions"><Promotions /></ProtectedRoute>}
          />
          <Route
            path="/notifications"
            element={<ProtectedRoute accessKey="notifications"><NotificationsInbox /></ProtectedRoute>}
          />
          <Route
            path="/notifications/settings"
            element={<ProtectedRoute accessKey="notifications"><NotificationSettingsForm /></ProtectedRoute>}
          />
          <Route
            path="/documents"
            element={<ProtectedRoute accessKey="documents"><Documents /></ProtectedRoute>}
          />
          <Route
            path="/catalogue/sync"
            element={<ProtectedRoute accessKey="produits"><CatalogueSyncViewer /></ProtectedRoute>}
          />
          <Route
            path="/commandes"
            element={<ProtectedRoute accessKey="fournisseurs"><Commandes /></ProtectedRoute>}
          />
          <Route
            path="/commandes/envoyees"
            element={<ProtectedRoute accessKey="fournisseurs"><CommandesEnvoyees /></ProtectedRoute>}
          />
          <Route
            path="/planning"
            element={<ProtectedRoute accessKey="planning_previsionnel"><Planning /></ProtectedRoute>}
          />
          <Route
            path="/planning/nouveau"
            element={<ProtectedRoute accessKey="planning_previsionnel"><PlanningForm /></ProtectedRoute>}
          />
          <Route
            path="/planning/:id"
            element={<ProtectedRoute accessKey="planning_previsionnel"><PlanningDetail /></ProtectedRoute>}
          />
          <Route
            path="/planning/simulation"
            element={<ProtectedRoute accessKey="planning_previsionnel"><SimulationPlanner /></ProtectedRoute>}
          />
          <Route
            path="/analyse"
            element={<ProtectedRoute accessKey="analyse"><Analyse /></ProtectedRoute>}
          />
          <Route
            path="/analyse/cost-centers"
            element={<ProtectedRoute accessKey="analyse"><AnalyseCostCenter /></ProtectedRoute>}
          />
          <Route
            path="/analyse/analytique"
            element={<ProtectedRoute accessKey="analyse"><AnalytiqueDashboard /></ProtectedRoute>}
          />
          <Route
            path="/menu-engineering"
            element={<ProtectedRoute accessKey="menu_engineering"><MenuEngineering /></ProtectedRoute>}
          />
          <Route path="/engineering" element={<EngineeringMenu />} />
          <Route
            path="/tableaux-de-bord"
            element={<ProtectedRoute accessKey="analyse"><TableauxDeBord /></ProtectedRoute>}
          />
          <Route
            path="/comparatif"
            element={<ProtectedRoute accessKey="analyse"><Comparatif /></ProtectedRoute>}
          />
          <Route
            path="/surcouts"
            element={<ProtectedRoute accessKey="analyse"><Surcouts /></ProtectedRoute>}
          />
          <Route
            path="/reporting"
            element={<ProtectedRoute accessKey="reporting"><Reporting /></ProtectedRoute>}
          />
          <Route
            path="/consolidation"
            element={<ProtectedRoute accessKey="consolidation"><Consolidation /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/utilisateurs"
            element={<ProtectedRoute accessKey="utilisateurs"><Utilisateurs /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/mamas"
            element={<ProtectedRoute accessKey="mamas"><Mamas /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/permissions"
            element={<ProtectedRoute accessKey="permissions"><Permissions /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/api-keys"
            element={<ProtectedRoute accessKey="apikeys"><APIKeys /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/api-fournisseurs"
            element={<ProtectedRoute accessKey="fournisseurs"><ApiFournisseurs /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/settings"
            element={<ProtectedRoute accessKey="settings"><MamaSettingsForm /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/zones-stock"
            element={<ProtectedRoute accessKey="zones_stock"><Zones /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/access"
            element={<ProtectedRoute accessKey="access"><AccessRights /></ProtectedRoute>}
          />
          <Route
            path="/consentements"
            element={<ProtectedRoute accessKey="parametrage"><Consentements /></ProtectedRoute>}
          />
          <Route
            path="/aide"
            element={<ProtectedRoute accessKey="aide"><AideContextuelle /></ProtectedRoute>}
          />
          <Route
            path="/feedback"
            element={<ProtectedRoute accessKey="feedback"><Feedback /></ProtectedRoute>}
          />
          <Route
            path="/stats"
            element={<ProtectedRoute accessKey="stats"><Stats /></ProtectedRoute>}
          />
          <Route
            path="/planning-module"
            element={<ProtectedRoute accessKey="planning"><PlanningModule /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/roles"
            element={<ProtectedRoute accessKey="roles"><Roles /></ProtectedRoute>}
          />
          <Route
            path="/licences"
            element={<ProtectedRoute accessKey="licences"><Licences /></ProtectedRoute>}
          />
          <Route
            path="/logs"
            element={<ProtectedRoute accessKey="logs"><Logs /></ProtectedRoute>}
          />
          <Route
            path="/audit"
            element={<ProtectedRoute accessKey="audit"><AuditTrail /></ProtectedRoute>}
          />
          <Route
            path="/supervision"
            element={<ProtectedRoute accessKey="dashboard"><SupervisionGroupe /></ProtectedRoute>}
          />
          <Route
            path="/supervision/comparateur"
            element={<ProtectedRoute accessKey="fiches_techniques"><ComparateurFiches /></ProtectedRoute>}
          />
          <Route
            path="/debug/auth"
            element={<ProtectedRoute accessKey="dashboard"><AuthDebug /></ProtectedRoute>}
          />
          <Route
            path="/debug/access"
            element={<ProtectedRoute accessKey="dashboard"><AccessExample /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

/* eslint-enable react-refresh/only-export-components */
