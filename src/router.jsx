import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import React, { lazy, Suspense } from "react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

// Pages principales (adaptées à la structure réelle)
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Stock = lazy(() => import("@/pages/Stock"));
const Produits = lazy(() => import("@/pages/produits/Produits.jsx"));
const ProduitDetail = lazy(() => import("@/pages/produits/ProduitDetail.jsx"));
const ProduitForm = lazy(() => import("@/pages/produits/ProduitForm.jsx"));
const Fiches = lazy(() => import("@/pages/fiches/Fiches.jsx"));
const FicheForm = lazy(() => import("@/pages/fiches/FicheForm.jsx"));
const FicheDetail = lazy(() => import("@/pages/fiches/FicheDetail.jsx"));
const Inventaire = lazy(() => import("@/pages/inventaire/Inventaire.jsx"));
const InventaireForm = lazy(() => import("@/pages/inventaire/InventaireForm.jsx"));
const EcartInventaire = lazy(() => import("@/pages/inventaire/EcartInventaire.jsx"));
const Factures = lazy(() => import("@/pages/factures/Factures.jsx"));
const FactureForm = lazy(() => import("@/pages/factures/FactureForm.jsx"));
const FactureDetail = lazy(() => import("@/pages/factures/FactureDetail.jsx"));
const Menus = lazy(() => import("@/pages/menus/Menus.jsx"));
const MenuForm = lazy(() => import("@/pages/menus/MenuForm.jsx"));
const Fournisseurs = lazy(() => import("@/pages/fournisseurs/Fournisseurs.jsx"));
const FournisseurDetail = lazy(() => import("@/pages/fournisseurs/FournisseurDetail.jsx"));
const Utilisateurs = lazy(() => import("@/pages/Utilisateurs.jsx"));
const Roles = lazy(() => import("@/pages/parametrage/Roles.jsx"));
const Permissions = lazy(() => import("@/pages/parametrage/Permissions.jsx"));
const Mamas = lazy(() => import("@/pages/parametrage/Mamas.jsx"));
const Parametrage = lazy(() => import("@/pages/Parametrage.jsx"));
const Login = lazy(() => import("@/pages/auth/Login.jsx"));
const Unauthorized = lazy(() => import("@/pages/auth/Unauthorized.jsx"));
const NotFound = lazy(() => import("@/pages/NotFound.jsx"));

// Ajoute ici tout nouveau module/page selon l’arborescence réelle

function ProtectedRoute({ children, accessKey }) {
  const { isAuthenticated, access_rights, loading } = useAuth();
  if (loading) return <div className="loader mx-auto my-16" />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (accessKey && !access_rights.includes(accessKey))
    return <Navigate to="/unauthorized" />;
  return children;
}

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

        {/* Homepage = Dashboard officiel */}
        <Route
          path="/"
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

        {/* Produits (liste, détail, formulaire) */}
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

        {/* Utilisateurs */}
        <Route
          path="/utilisateurs"
          element={
            <ProtectedRoute accessKey="parametrage">
              <Utilisateurs />
            </ProtectedRoute>
          }
        />

        {/* Paramétrage & sous-modules */}
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

        {/* Auth, erreurs */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
