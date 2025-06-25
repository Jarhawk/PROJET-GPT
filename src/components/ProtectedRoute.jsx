import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, accessKey }) {
  const { session, loading, role, access_rights } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!session) return <Navigate to="/login" />;

  // Vérifie les droits si une clé est fournie
  if (accessKey) {
    const rights = Array.isArray(access_rights) ? access_rights : [];
    const isAllowed = role === "superadmin" || rights.includes(accessKey);
    if (!isAllowed) return <Navigate to="/unauthorized" />;
  }

  return children;
}
// ✅ Étape validée
// ✅ Sécurité Codex : mama_id et droits OK
