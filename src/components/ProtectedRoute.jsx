import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function ProtectedRoute({ children, accessKey }) {
  const { session, userData, pending, loading, hasAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session || !userData || !userData.role || pending || loading) return;

    if (userData.actif === false) {
      navigate("/blocked", { replace: true });
      return;
    }

    const noRights =
      !userData.access_rights ||
      (typeof userData.access_rights === "object" &&
        Object.keys(userData.access_rights).length === 0);
    if (noRights) {
      navigate("/unauthorized", { replace: true });
      return;
    }

    if (accessKey && !hasAccess(accessKey, "peut_voir")) {
      navigate("/unauthorized", { replace: true });
    }
  }, [session, userData, pending, loading, accessKey, navigate, hasAccess]);
  if (!session || pending || loading || !userData || !userData.role) return <LoadingScreen />;
  return children;
}
