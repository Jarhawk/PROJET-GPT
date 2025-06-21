import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ accessKey, children }) {
  const { session, loading, access_rights } = useAuth();

  if (loading) return null;

  if (!session) return <Navigate to="/login" />;
  if (accessKey && !access_rights.includes(accessKey)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
