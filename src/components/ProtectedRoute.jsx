import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

export default function ProtectedRoute({ accessKey, children }) {
  const { session, loading, access_rights, role, actif, mama_id, pending } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!session) return <Navigate to="/login" />;
  if (pending) return <Navigate to="/pending" />;
  if (actif === false) return <Navigate to="/blocked" />;
  if (!role || mama_id === null || access_rights === null) {
    return <Navigate to="/unauthorized" />;
  }
  if (Array.isArray(access_rights) && access_rights.length === 0) {
    return <Navigate to="/unauthorized" />;
  }
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
