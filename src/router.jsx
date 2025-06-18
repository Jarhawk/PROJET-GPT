import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import React, { lazy, Suspense } from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

// --- Imports pages réels ---
const Dashboard = lazy(() => import("@/pages/Dashboard.jsx"));
const Stock = lazy(() => import("@/pages/Stock.jsx"));

// Produits
const Produits = lazy(() => import("@/pages/produits/Produits.jsx"));
const ProduitDetail = lazy(() => import("@/components/produits/ProduitDetail.jsx"));
const ProduitForm = lazy(() => import("@/components/produits/ProduitForm.jsx"));

// Fournisseurs
const Fournisseurs = lazy(() => import("@/pages/fournisseurs/Fournisseurs.jsx"));
const FournisseurDetail = lazy(() => import("@/pages/fournisseurs/FournisseurDetail.jsx"));
const ComparatifPrix = lazy(() => import("@/pages/fournisseurs/comparatif/ComparatifPrix.jsx"));

// Factures
const Factures = lazy(() => import("@/pages/factures/Factures.jsx"));
const FactureForm = lazy(() => import("@/pages/factures/FactureForm.jsx"));
const FactureDetail = lazy(() => import("@/pages/factures/FactureDetail.jsx"));

// Fiches Techniques
const Fiches = lazy(() => import("@/pages/fiches/Fiches.jsx"));
const FicheForm = lazy(() => import("@/pages/fiches/FicheForm.jsx"));
const FicheDetail = lazy(() => import("@/pages/fiches/FicheDetail.jsx"));
const Carte = lazy(() => import("@/pages/carte/Carte.jsx"));
const MenuEngineering = lazy(() => import("@/pages/MenuEngineering.jsx"));

// Inventaire
const Inventaire = lazy(() => import("@/pages/inventaire/Inventaire.jsx"));
const InventaireForm = lazy(() => import("@/pages/inventaire/InventaireForm.jsx"));
const EcartInventaire = lazy(() => import("@/pages/inventaire/EcartInventaire.jsx"));

// Mouvements Stock
const Mouvements = lazy(() => import("@/pages/mouvements/Mouvements.jsx"));
const MouvementDetail = lazy(() => import("@/components/mouvements/MouvementFormModal.jsx"));
const Pertes = lazy(() => import("@/pages/Pertes.jsx"));

// Menus
const Menus = lazy(() => import("@/pages/menus/Menus.jsx"));
const MenuForm = lazy(() => import("@/pages/menus/MenuForm.jsx"));

// Utilisateurs et Paramétrage
const Utilisateurs = lazy(() => import("@/pages/Utilisateurs.jsx"));
const Roles = lazy(() => import("@/pages/parametrage/Roles.jsx"));
const Permissions = lazy(() => import("@/pages/parametrage/Permissions.jsx"));
const Mamas = lazy(() => import("@/pages/parametrage/Mamas.jsx"));
const Parametrage = lazy(() => import("@/pages/parametrage/Parametrage.jsx"));
const Journal = lazy(() => import("@/pages/Journal.jsx"));
const StatsCostCenters = lazy(() => import("@/pages/stats/StatsCostCenters.jsx"));
const StatsCostCentersPivot = lazy(() => import("@/pages/stats/StatsCostCentersPivot.jsx"));
const StatsStock = lazy(() => import("@/pages/stats/StatsStock.jsx"));

// Taches
const Taches = lazy(() => import("@/pages/taches/Taches.jsx"));
const TacheNew = lazy(() => import("@/pages/taches/TacheNew.jsx"));
const TacheDetail = lazy(() => import("@/pages/taches/TacheDetail.jsx"));

// Pages Auth et UI
const Login = lazy(() => import("@/pages/auth/Login.jsx"));
const Logout = lazy(() => import("@/pages/auth/Logout.jsx"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword.jsx"));
const UpdatePassword = lazy(() => import("@/pages/auth/UpdatePassword.jsx"));
const AuthDebug = lazy(() => import("@/pages/debug/AuthDebug.jsx"));
const Unauthorized = lazy(() => import("@/pages/auth/Unauthorized.jsx"));
const NotFound = lazy(() => import("@/pages/NotFound.jsx"));

// ProtectedRoute (inline)
function ProtectedRoute({ children, accessKey }) {
  const { isAuthenticated, access_rights, loading } = useAuth();
  if (loading) return <div className="loader mx-auto my-16" />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (accessKey && !access_rights?.includes(accessKey)) return <Navigate to="/unauthorized" />;
  return children;
}

// Layout avec breadcrumbs
function LayoutWithBreadcrumb() {
  return (
    <>
      <Breadcrumbs />
      <Suspense fallback={<div className="loader mx-auto my-8" />}>
        <Outlet />
      </Suspense>
    </>
  );
}

export default function RouterConfig() {
  return (
    <Routes>
      <Route element={<LayoutWithBreadcrumb />}>
        {/* Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute accessKey="dashboard">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Stock */}
        <Route
          path="/stock"
          element={
            <ProtectedRoute accessKey="stock">
              <Stock />
            </ProtectedRoute>
          }
        />

        {/* Produits */}
        <Route
          path="/produits"
          element={
            <ProtectedRoute accessKey="stock">
              <Produits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/produits/nouveau"
          element={
            <ProtectedRoute accessKey="stock">
              <ProduitForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/produits/:id"
          element={
            <ProtectedRoute accessKey="stock">
              <ProduitDetail />
            </ProtectedRoute>
          }
        />

        {/* Fournisseurs */}
        <Route
          path="/fournisseurs"
          element={
            <ProtectedRoute accessKey="fournisseurs">
              <Fournisseurs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fournisseurs/:id"
          element={
            <ProtectedRoute accessKey="fournisseurs">
              <FournisseurDetail />
            </ProtectedRoute>
          }
        />

        {/* Comparatif prix */}
        <Route
          path="/fournisseurs/comparatif"
          element={
            <ProtectedRoute accessKey="fournisseurs">
              <ComparatifPrix />
            </ProtectedRoute>
          }
        />

        {/* Factures */}
        <Route
          path="/factures"
          element={
            <ProtectedRoute accessKey="factures">
              <Factures />
            </ProtectedRoute>
          }
        />
        <Route
          path="/factures/nouveau"
          element={
            <ProtectedRoute accessKey="factures">
              <FactureForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/factures/:id"
          element={
            <ProtectedRoute accessKey="factures">
              <FactureDetail />
            </ProtectedRoute>
          }
        />

        {/* Fiches techniques */}
        <Route
          path="/fiches"
          element={
            <ProtectedRoute accessKey="fiches">
              <Fiches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiches/nouveau"
          element={
            <ProtectedRoute accessKey="fiches">
              <FicheForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fiches/:id"
          element={
            <ProtectedRoute accessKey="fiches">
              <FicheDetail />
            </ProtectedRoute>
          }
        />

        {/* Carte */}
        <Route
          path="/carte"
          element={
            <ProtectedRoute accessKey="fiches">
              <Carte />
            </ProtectedRoute>
          }
        />

        {/* Menu engineering */}
        <Route
          path="/menu-engineering"
          element={
            <ProtectedRoute accessKey="fiches">
              <MenuEngineering />
            </ProtectedRoute>
          }
        />

        {/* Inventaire */}
        <Route
          path="/inventaire"
          element={
            <ProtectedRoute accessKey="inventaires">
              <Inventaire />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventaire/nouveau"
          element={
            <ProtectedRoute accessKey="inventaires">
              <InventaireForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventaire/ecart/:id"
          element={
            <ProtectedRoute accessKey="inventaires">
              <EcartInventaire />
            </ProtectedRoute>
          }
        />

        {/* Mouvements */}
        <Route
          path="/mouvements"
          element={
            <ProtectedRoute accessKey="stock">
              <Mouvements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mouvements/:id"
          element={
            <ProtectedRoute accessKey="stock">
              <MouvementDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pertes"
          element={
            <ProtectedRoute accessKey="stock">
              <Pertes />
            </ProtectedRoute>
          }
        />

        {/* Menus */}
        <Route
          path="/menus"
          element={
            <ProtectedRoute accessKey="menus">
              <Menus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menus/nouveau"
          element={
            <ProtectedRoute accessKey="menus">
              <MenuForm />
            </ProtectedRoute>
          }
        />

        {/* Taches */}
        <Route
          path="/taches"
          element={
            <ProtectedRoute accessKey="taches">
              <Taches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/taches/nouveau"
          element={
            <ProtectedRoute accessKey="taches">
              <TacheNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/taches/:id"
          element={
            <ProtectedRoute accessKey="taches">
              <TacheDetail />
            </ProtectedRoute>
          }
        />

        {/* Utilisateurs */}
        <Route
          path="/utilisateurs"
          element={
            <ProtectedRoute accessKey="parametrage">
              <Utilisateurs />
            </ProtectedRoute>
          }
        />

        {/* Paramétrage */}
        <Route
          path="/parametrage"
          element={
            <ProtectedRoute accessKey="parametrage">
              <Parametrage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parametrage/roles"
          element={
            <ProtectedRoute accessKey="parametrage">
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parametrage/permissions"
          element={
            <ProtectedRoute accessKey="parametrage">
              <Permissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parametrage/mamas"
          element={
            <ProtectedRoute accessKey="parametrage">
              <Mamas />
            </ProtectedRoute>
          }
        />

        {/* Journal d'audit */}
        <Route
          path="/journal"
          element={
            <ProtectedRoute accessKey="audit">
              <Journal />
            </ProtectedRoute>
          }
        />

        {/* Stats cost centers */}
        <Route
          path="/stats/cost-centers"
          element={
            <ProtectedRoute accessKey="dashboard">
              <StatsCostCenters />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats/cost-centers-monthly"
          element={
            <ProtectedRoute accessKey="dashboard">
              <StatsCostCentersPivot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats/stocks"
          element={
            <ProtectedRoute accessKey="dashboard">
              <StatsStock />
            </ProtectedRoute>
          }
        />

        {/* Auth, erreurs */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/debug/auth" element={<AuthDebug />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
