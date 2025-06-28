import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ProtectedRoute({ children, accessKey }) {
  const { session, user, mama_id, loading, access_rights, isSuperadmin } =
    useAuth();

  if (loading || access_rights === null)
    return <LoadingSpinner message="Chargement..." />;
  if (!session || !user) return <Navigate to="/login" />;
  if (!mama_id) return <Navigate to="/pending" />;

  // Vérifie les droits si une clé est fournie
  if (accessKey) {
    const rights = Array.isArray(access_rights) ? access_rights : [];
    const isAllowed = isSuperadmin || rights.includes(accessKey);
    if (!isAllowed) {
      console.log('Access denied', {
        user,
        mama_id,
        accessKey,
        access_rights: rights,
        session,
      });
      return <Navigate to="/unauthorized" />;
    }
  }

  return children;
}
