import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Produits from "@/pages/produits/Produits";
import Factures from "@/pages/factures/Factures";
import Fiches from "@/pages/fiches/Fiches";
import Parametrage from "@/pages/parametrage/Parametrage";
import Login from "@/pages/auth/Login";
import Unauthorized from "@/pages/auth/Unauthorized";
import AuthDebug from "@/pages/debug/AuthDebug";
import { useAuth } from "@/context/AuthContext";

function ProtectedRoute({ children, access }) {
  const { isAuthenticated, loading, role, access_rights } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (
    access &&
    role !== "superadmin" &&
    !access_rights?.includes(access)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute access="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produits"
            element={
              <ProtectedRoute access="stock">
                <Produits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factures"
            element={
              <ProtectedRoute access="factures">
                <Factures />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fiches"
            element={
              <ProtectedRoute access="fiches">
                <Fiches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parametrage"
            element={
              <ProtectedRoute access="parametrage">
                <Parametrage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debug/auth"
            element={
              <ProtectedRoute>
                <AuthDebug />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
