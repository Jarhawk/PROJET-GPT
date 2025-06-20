import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/layout/Layout";
import Login from "@/pages/auth/Login";
import Unauthorized from "@/pages/auth/Unauthorized";
import AuthDebug from "@/pages/debug/AuthDebug";
import { useAuth } from "@/context/AuthContext";

const Dashboard = lazy(() => import("@/pages/Dashboard.jsx"));
const Fournisseurs = lazy(() => import("@/pages/fournisseurs/Fournisseurs.jsx"));
const Factures = lazy(() => import("@/pages/factures/Factures.jsx"));
const FactureDetail = lazy(() => import("@/pages/factures/FactureDetail.jsx"));
const Fiches = lazy(() => import("@/pages/fiches/Fiches.jsx"));
const FicheDetail = lazy(() => import("@/pages/fiches/FicheDetail.jsx"));
const Menus = lazy(() => import("@/pages/menus/Menus.jsx"));
const Produits = lazy(() => import("@/pages/produits/Produits.jsx"));
const ProduitDetail = lazy(() => import("@/pages/produits/ProduitDetail.jsx"));
const Inventaire = lazy(() => import("@/pages/inventaire/Inventaire.jsx"));
const Mouvements = lazy(() => import("@/pages/mouvements/Mouvements.jsx"));
const Alertes = lazy(() => import("@/pages/Alertes.jsx"));
const Promotions = lazy(() => import("@/pages/promotions/Promotions.jsx"));
const Documents = lazy(() => import("@/pages/Documents.jsx"));
const Analyse = lazy(() => import("@/pages/analyse/Analyse.jsx"));
const AnalyseCostCenter = lazy(() => import("@/pages/analyse/AnalyseCostCenter.jsx"));
const Utilisateurs = lazy(() => import("@/pages/Utilisateurs.jsx"));
const Roles = lazy(() => import("@/pages/parametrage/Roles.jsx"));
const Mamas = lazy(() => import("@/pages/parametrage/Mamas.jsx"));
const Permissions = lazy(() => import("@/pages/parametrage/Permissions.jsx"));
const AccessRights = lazy(() => import("@/pages/parametrage/AccessRights.jsx"));
const Onboarding = lazy(() => import("@/pages/Onboarding.jsx"));
const AideContextuelle = lazy(() => import("@/pages/AideContextuelle.jsx"));

const accessMap = {
  "/dashboard": "dashboard",
  "/fournisseurs": "fournisseurs",
  "/factures": "factures",
  "/factures/:id": "factures",
  "/fiches": "fiches",
  "/fiches/:id": "fiches",
  "/menus": "menus",
  "/produits": "produits",
  "/produits/:id": "produits",
  "/inventaire": "inventaires",
  "/mouvements": "mouvements",
  "/alertes": "alertes",
  "/promotions": "promotions",
  "/documents": "documents",
  "/analyse": "analyse",
  "/analyse/cost-centers": "analyse",
  "/parametrage/utilisateurs": "utilisateurs",
  "/parametrage/roles": "roles",
  "/parametrage/mamas": "mamas",
  "/parametrage/permissions": "permissions",
  "/parametrage/access": "access",
  "/onboarding": "onboarding",
  "/aide": "aide",
};

function ProtectedRoute({ children, path }) {
  const { isAuthenticated, loading, role, access_rights } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const access = accessMap[path] || null;
  if (access && role !== "superadmin" && !access_rights?.includes(access)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

export default function Router() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={<ProtectedRoute path="/dashboard"><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/fournisseurs"
            element={<ProtectedRoute path="/fournisseurs"><Fournisseurs /></ProtectedRoute>}
          />
          <Route
            path="/factures"
            element={<ProtectedRoute path="/factures"><Factures /></ProtectedRoute>}
          />
          <Route
            path="/factures/:id"
            element={<ProtectedRoute path="/factures/:id"><FactureDetail /></ProtectedRoute>}
          />
          <Route
            path="/fiches"
            element={<ProtectedRoute path="/fiches"><Fiches /></ProtectedRoute>}
          />
          <Route
            path="/fiches/:id"
            element={<ProtectedRoute path="/fiches/:id"><FicheDetail /></ProtectedRoute>}
          />
          <Route
            path="/menus"
            element={<ProtectedRoute path="/menus"><Menus /></ProtectedRoute>}
          />
          <Route
            path="/produits"
            element={<ProtectedRoute path="/produits"><Produits /></ProtectedRoute>}
          />
          <Route
            path="/produits/:id"
            element={<ProtectedRoute path="/produits/:id"><ProduitDetail /></ProtectedRoute>}
          />
          <Route
            path="/inventaire"
            element={<ProtectedRoute path="/inventaire"><Inventaire /></ProtectedRoute>}
          />
          <Route
            path="/mouvements"
            element={<ProtectedRoute path="/mouvements"><Mouvements /></ProtectedRoute>}
          />
          <Route
            path="/alertes"
            element={<ProtectedRoute path="/alertes"><Alertes /></ProtectedRoute>}
          />
          <Route
            path="/promotions"
            element={<ProtectedRoute path="/promotions"><Promotions /></ProtectedRoute>}
          />
          <Route
            path="/documents"
            element={<ProtectedRoute path="/documents"><Documents /></ProtectedRoute>}
          />
          <Route
            path="/analyse"
            element={<ProtectedRoute path="/analyse"><Analyse /></ProtectedRoute>}
          />
          <Route
            path="/analyse/cost-centers"
            element={<ProtectedRoute path="/analyse/cost-centers"><AnalyseCostCenter /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/utilisateurs"
            element={<ProtectedRoute path="/parametrage/utilisateurs"><Utilisateurs /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/roles"
            element={<ProtectedRoute path="/parametrage/roles"><Roles /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/mamas"
            element={<ProtectedRoute path="/parametrage/mamas"><Mamas /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/permissions"
            element={<ProtectedRoute path="/parametrage/permissions"><Permissions /></ProtectedRoute>}
          />
          <Route
            path="/parametrage/access"
            element={<ProtectedRoute path="/parametrage/access"><AccessRights /></ProtectedRoute>}
          />
          <Route
            path="/onboarding"
            element={<ProtectedRoute path="/onboarding"><Onboarding /></ProtectedRoute>}
          />
          <Route
            path="/aide"
            element={<ProtectedRoute path="/aide"><AideContextuelle /></ProtectedRoute>}
          />
          <Route
            path="/debug/auth"
            element={<ProtectedRoute path="/debug/auth"><AuthDebug /></ProtectedRoute>}
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
