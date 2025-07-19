// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import Layout from "@/layout/Layout";
import Login from "@/pages/auth/Login";
import Unauthorized from "@/pages/auth/Unauthorized";
import Pending from "@/pages/auth/Pending";
import Blocked from "@/pages/auth/Blocked";
import AuthDebug from "@/pages/debug/AuthDebug";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const Dashboard = lazy(() => import("@/pages/Dashboard.jsx"));
const Fournisseurs = lazy(() => import("@/pages/fournisseurs/Fournisseurs.jsx"));
const FournisseurCreate = lazy(() => import("@/pages/fournisseurs/FournisseurCreate.jsx"));
const FournisseurDetailPage = lazy(() => import("@/pages/fournisseurs/FournisseurDetailPage.jsx"));
const Factures = lazy(() => import("@/pages/factures/Factures.jsx"));
const FactureDetail = lazy(() => import("@/pages/factures/FactureDetail.jsx"));
const ImportFactures = lazy(() => import("@/pages/factures/ImportFactures.jsx"));
const FactureCreate = lazy(() => import("@/pages/factures/FactureCreate.jsx"));
const Fiches = lazy(() => import("@/pages/fiches/Fiches.jsx"));
const FicheDetail = lazy(() => import("@/pages/fiches/FicheDetail.jsx"));
const Carte = lazy(() => import("@/pages/carte/Carte.jsx"));
const Menus = lazy(() => import("@/pages/menus/Menus.jsx"));
const Produits = lazy(() => import("@/pages/produits/Produits.jsx"));
const ProduitDetail = lazy(() => import("@/pages/produits/ProduitDetail.jsx"));
const ProduitForm = lazy(() => import("@/pages/produits/ProduitForm.jsx"));
const Inventaire = lazy(() => import("@/pages/inventaire/Inventaire.jsx"));
const InventaireForm = lazy(() => import("@/pages/inventaire/InventaireForm.jsx"));
const InventaireDetail = lazy(() => import("@/pages/inventaire/InventaireDetail.jsx"));
const InventaireZones = lazy(() => import("@/pages/inventaire/InventaireZones.jsx"));
const Mouvements = lazy(() => import("@/pages/mouvements/Mouvements.jsx"));
const Alertes = lazy(() => import("@/pages/Alertes.jsx"));
const Taches = lazy(() => import("@/pages/taches/Taches.jsx"));
const TacheForm = lazy(() => import("@/pages/taches/TacheForm.jsx"));
const AlertesTaches = lazy(() => import("@/pages/taches/Alertes.jsx"));
const Promotions = lazy(() => import("@/pages/promotions/Promotions.jsx"));
const Documents = lazy(() => import("@/pages/documents/Documents.jsx"));
const Analyse = lazy(() => import("@/pages/analyse/Analyse.jsx"));
const AnalyseCostCenter = lazy(() => import("@/pages/analyse/AnalyseCostCenter.jsx"));
const AnalytiqueDashboard = lazy(() => import("@/pages/analytique/AnalytiqueDashboard.jsx"));
const Utilisateurs = lazy(() => import("@/pages/parametrage/Utilisateurs.jsx"));
const Roles = lazy(() => import("@/pages/parametrage/Roles.jsx"));
const Mamas = lazy(() => import("@/pages/parametrage/Mamas.jsx"));
const Permissions = lazy(() => import("@/pages/parametrage/Permissions.jsx"));
const AccessRights = lazy(() => import("@/pages/parametrage/AccessRights.jsx"));
const APIKeys = lazy(() => import("@/pages/parametrage/APIKeys.jsx"));
const MamaSettingsForm = lazy(() => import("@/pages/parametrage/MamaSettingsForm.jsx"));
const Onboarding = lazy(() => import("@/pages/public/Onboarding.jsx"));
const Accueil = lazy(() => import("@/pages/Accueil.jsx"));
const Signup = lazy(() => import("@/pages/public/Signup.jsx"));
const Rgpd = lazy(() => import("@/pages/Rgpd.jsx"));
const PagePrivacy = lazy(() => import("@/pages/public/PagePrivacy.jsx"));
const PageMentions = lazy(() => import("@/pages/public/PageMentions.jsx"));
const PageCgu = lazy(() => import("@/pages/public/PageCgu.jsx"));
const PageCgv = lazy(() => import("@/pages/public/PageCgv.jsx"));
const AideContextuelle = lazy(() => import("@/pages/AideContextuelle.jsx"));
const SupervisionGroupe = lazy(() => import("@/pages/supervision/SupervisionGroupe.jsx"));
const ComparateurFiches = lazy(() => import("@/pages/supervision/ComparateurFiches.jsx"));
const NotificationsInbox = lazy(() => import("@/pages/notifications/NotificationsInbox.jsx"));
const NotificationSettingsForm = lazy(() => import("@/pages/notifications/NotificationSettingsForm.jsx"));
const FournisseurApiSettingsForm = lazy(() => import("@/pages/fournisseurs/FournisseurApiSettingsForm.jsx"));
const ApiFournisseurs = lazy(() => import("@/pages/fournisseurs/ApiFournisseurs.jsx"));
const CatalogueSyncViewer = lazy(() => import("@/pages/catalogue/CatalogueSyncViewer.jsx"));
const CommandesEnvoyees = lazy(() => import("@/pages/commandes/CommandesEnvoyees.jsx"));
const SimulationPlanner = lazy(() => import("@/pages/planning/SimulationPlanner.jsx"));
const Planning = lazy(() => import("@/pages/Planning.jsx"));
const PlanningForm = lazy(() => import("@/pages/PlanningForm.jsx"));
const PlanningDetail = lazy(() => import("@/pages/PlanningDetail.jsx"));
const DashboardBuilder = lazy(() => import("@/pages/dashboard/DashboardBuilder.jsx"));
const Reporting = lazy(() => import("@/pages/reporting/Reporting.jsx"));
const Consolidation = lazy(() => import("@/pages/Consolidation.jsx"));
const CreateMama = lazy(() => import("@/pages/auth/CreateMama.jsx"));
const Feedback = lazy(() => import("@/pages/Feedback.jsx"));
const AuditTrail = lazy(() => import("@/pages/AuditTrail.jsx"));
const Requisitions = lazy(() => import("@/pages/requisitions/Requisitions.jsx"));
const RequisitionForm = lazy(() => import("@/pages/requisitions/RequisitionForm.jsx"));
const RequisitionDetail = lazy(() => import("@/pages/requisitions/RequisitionDetail.jsx"));
const Receptions = lazy(() => import("@/pages/receptions/Receptions.jsx"));
const BonsLivraison = lazy(() => import("@/pages/bons_livraison/BonsLivraison.jsx"));
const BLCreate = lazy(() => import("@/pages/bons_livraison/BLCreate.jsx"));
const BLDetail = lazy(() => import("@/pages/bons_livraison/BLDetail.jsx"));
const Recettes = lazy(() => import("@/pages/recettes/Recettes.jsx"));
const Surcouts = lazy(() => import("@/pages/surcouts/Surcouts.jsx"));
const TableauxDeBord = lazy(() => import("@/pages/analyse/TableauxDeBord.jsx"));
const Comparatif = lazy(() => import("@/pages/fournisseurs/comparatif/ComparatifPrix.jsx"));
const MenuEngineering = lazy(() => import("@/pages/MenuEngineering.jsx"));
const EngineeringMenu = lazy(() => import("@/pages/EngineeringMenu.jsx"));
const Logout = lazy(() => import("@/pages/auth/Logout.jsx"));


function RootRoute() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Chargement..." />;
  if (session && session.user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/accueil" replace />;
}

export default function Router() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner message="Chargement..." />}>
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
        <Route path="/privacy" element={<PagePrivacy />} />
        <Route path="/mentions" element={<PageMentions />} />
        <Route path="/cgu" element={<PageCgu />} />
        <Route path="/cgv" element={<PageCgv />} />
        <Route path="/" element={<Layout />}>
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
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
            element={<ProtectedRoute accessKey="fiches"><Fiches /></ProtectedRoute>}
          />
          <Route
            path="/fiches/:id"
            element={<ProtectedRoute accessKey="fiches"><FicheDetail /></ProtectedRoute>}
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
            path="/parametrage/roles"
            element={<ProtectedRoute accessKey="roles"><Roles /></ProtectedRoute>}
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
            path="/parametrage/access"
            element={<ProtectedRoute accessKey="access"><AccessRights /></ProtectedRoute>}
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
            path="/audit"
            element={<ProtectedRoute accessKey="audit"><AuditTrail /></ProtectedRoute>}
          />
          <Route
            path="/supervision"
            element={<ProtectedRoute accessKey="dashboard"><SupervisionGroupe /></ProtectedRoute>}
          />
          <Route
            path="/supervision/comparateur"
            element={<ProtectedRoute accessKey="fiches"><ComparateurFiches /></ProtectedRoute>}
          />
          <Route
            path="/debug/auth"
            element={<ProtectedRoute accessKey="dashboard"><AuthDebug /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
