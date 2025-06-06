// src/router.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/layout/AdminLayout";
import ViewerLayout from "@/layout/ViewerLayout";
import Login from "@/pages/auth/Login";
import Unauthorized from "@/pages/auth/Unauthorized";
import Dashboard from "@/pages/dashboard/Dashboard";

import Factures from "@/pages/factures/Factures";
import FactureDetail from "@/pages/factures/FactureDetail";

import Produits from "@/pages/produits/Produits";
import ProduitDetail from "@/pages/produits/ProduitDetail";
import ProduitForm from "@/pages/produits/ProduitForm";
import Inventaire from "@/pages/Inventaire";
import Requisitions from "@/pages/Requisitions";
import Mouvements from "@/pages/Mouvements";

import Fiches from "@/pages/fiches/Fiches";
import FicheForm from "@/pages/fiches/FicheForm";
import FicheDetail from "@/pages/fiches/FicheDetail";

import Roles from "@/pages/parametrage/Roles";
import Utilisateurs from "@/pages/parametrage/Utilisateurs";
import Mamas from "@/pages/parametrage/Mamas";
import MamaForm from "@/pages/parametrage/MamaForm";
import PermissionsAdmin from "@/pages/parametrage/PermissionsAdmin";
import PermissionsForm from "@/pages/parametrage/PermissionsForm";

import Menus from "@/pages/menus/Menus";
import CostBoisson from "@/pages/costboisson/CostBoisson";

const ProtectedRoute = ({ element, accessKey }) => {
  const { session, authReady, access_rights } = useAuth();
  const location = useLocation();

  if (!authReady) return <div className="text-center p-6">Chargement des autorisations...</div>;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  const allowed = accessKey ? access_rights?.[accessKey] === true : true;
  if (accessKey && !allowed) return <Navigate to="/unauthorized" replace />;

  return element;
};

const RouteWithLayout = ({ element, accessKey }) => {
  const { role } = useAuth();
  const Layout = role === "viewer" ? ViewerLayout : AdminLayout;
  return <ProtectedRoute accessKey={accessKey} element={<Layout>{element}</Layout>} />;
};

export default function Router() {
  const { session, authReady } = useAuth();

  if (!authReady) return <div className="text-center p-6">Initialisation de l'application...</div>;

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<RouteWithLayout element={<Dashboard />} accessKey="dashboard" />} />

      {/* Factures */}
      <Route path="/factures" element={<RouteWithLayout element={<Factures />} accessKey="factures" />} />
      <Route path="/factures/:id" element={<RouteWithLayout element={<FactureDetail />} accessKey="factures" />} />

      {/* Produits */}
      <Route path="/produits" element={<RouteWithLayout element={<Produits />} accessKey="produits" />} />
      <Route path="/produits/nouveau" element={<RouteWithLayout element={<ProduitForm />} accessKey="produits" />} />
      <Route path="/produits/:id" element={<RouteWithLayout element={<ProduitDetail />} accessKey="produits" />} />

      {/* Stock */}
      <Route path="/inventaire" element={<RouteWithLayout element={<Inventaire />} accessKey="inventaire" />} />
      <Route path="/requisitions" element={<RouteWithLayout element={<Requisitions />} accessKey="requisitions" />} />
      <Route path="/mouvements" element={<RouteWithLayout element={<Mouvements />} accessKey="mouvements" />} />

      {/* Fiches techniques */}
      <Route path="/fiches" element={<RouteWithLayout element={<Fiches />} accessKey="fiches" />} />
      <Route path="/fiches/nouveau" element={<RouteWithLayout element={<FicheForm />} accessKey="fiches" />} />
      <Route path="/fiches/:id" element={<RouteWithLayout element={<FicheDetail />} accessKey="fiches" />} />

      {/* Menus */}
      <Route path="/menus" element={<RouteWithLayout element={<Menus />} accessKey="menus" />} />

      {/* Analyse */}
      <Route path="/cost-boisson" element={<RouteWithLayout element={<CostBoisson />} accessKey="costboisson" />} />

      {/* Paramétrage */}
      <Route path="/parametrage/roles" element={<RouteWithLayout element={<Roles />} accessKey="roles" />} />
      <Route path="/parametrage/utilisateurs" element={<RouteWithLayout element={<Utilisateurs />} accessKey="utilisateurs" />} />
      <Route path="/parametrage/mamas" element={<RouteWithLayout element={<Mamas />} accessKey="mamas" />} />
      <Route path="/parametrage/mamas/:id" element={<RouteWithLayout element={<MamaForm />} accessKey="mamas" />} />
      <Route path="/parametrage/permissions" element={<RouteWithLayout element={<PermissionsAdmin />} accessKey="permissions" />} />
      <Route path="/parametrage/permissions/:id" element={<RouteWithLayout element={<PermissionsForm />} accessKey="permissions" />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
