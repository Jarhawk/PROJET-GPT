import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PageSkeleton from "@/components/ui/PageSkeleton";

export default function ProtectedRoute({ accessKey, children }) {
  const location = useLocation();
  const { session, userData, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!session?.user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const rights = userData?.access_rights || {};
  const allowed = accessKey ? rights[accessKey]?.peut_voir === true : true;
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
