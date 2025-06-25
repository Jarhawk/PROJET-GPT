import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!session) return <Navigate to="/login" />;
  return children;
}
// ✅ Étape validée
