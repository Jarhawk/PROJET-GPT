import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/layout/Layout";
import Login from "@/pages/auth/Login";
import Unauthorized from "@/pages/auth/Unauthorized";
import AuthDebug from "@/pages/debug/AuthDebug";
import ProtectedRoute from "@/components/ProtectedRoute";

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


export default function Router() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={<ProtectedRoute accessKey="dashboard"><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/fournisseurs"
            element={<ProtectedRoute accessKey="fournisseurs"><Fournisseurs /></ProtectedRoute>}
          />
          <Route
            path="/factures"
            element={<ProtectedRoute accessKey="factures"><Factures /></ProtectedRoute>}
          />
          <Route
            path="/factures/:id"
            element={<ProtectedRoute accessKey="factures"><FactureDetail /></ProtectedRoute>}
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
            path="/produits"
            element={<ProtectedRoute accessKey="produits"><Produits /></ProtectedRoute>}
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
            path="/mouvements"
            element={<ProtectedRoute accessKey="mouvements"><Mouvements /></ProtectedRoute>}
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
            path="/documents"
            element={<ProtectedRoute accessKey="documents"><Documents /></ProtectedRoute>}
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
            path="/parametrage/access"
            element={<ProtectedRoute accessKey="access"><AccessRights /></ProtectedRoute>}
          />
          <Route
            path="/onboarding"
            element={<ProtectedRoute accessKey="onboarding"><Onboarding /></ProtectedRoute>}
          />
          <Route
            path="/aide"
            element={<ProtectedRoute accessKey="aide"><AideContextuelle /></ProtectedRoute>}
          />
          <Route
            path="/debug/auth"
            element={<ProtectedRoute accessKey="dashboard"><AuthDebug /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
