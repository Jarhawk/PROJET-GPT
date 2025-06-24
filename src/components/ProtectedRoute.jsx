import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ accessKey, children }) {
  const { session, loading, access_rights, role, actif, mama_id } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!session) return <Navigate to="/login" />;
  if (actif === false) return <Navigate to="/blocked" />;
  if (!mama_id && location.pathname !== "/create-mama") {
    return <Navigate to="/create-mama" />;
  }
  if (
    role !== "superadmin" &&
    accessKey &&
    !access_rights.includes(accessKey)
  ) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
