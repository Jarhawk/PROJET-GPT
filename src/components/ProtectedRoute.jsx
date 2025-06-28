import { Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ProtectedRoute({ children, accessKey }) {
  const {
    session,
    userData,
    loading,
    pending,
    access_rights,
    isSuperadmin,
    isAuthenticated,
  } = useAuth();

  if (loading || access_rights === null)
    return <LoadingSpinner message="Chargement..." />;

  if (pending) return <Navigate to="/pending" />;

  if (!session || !isAuthenticated || !userData) return <Navigate to="/login" />;

  if (userData?.actif === false) return <Navigate to="/blocked" />;

  // Vérifie les droits si une clé est fournie
  if (accessKey) {
    const rights = typeof access_rights === "object" ? access_rights : {};
    const isAllowed = isSuperadmin || rights[accessKey];
    if (!isAllowed) return <Navigate to="/unauthorized" />;
  }

  return children;
}
