import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasAccess } from "@/lib/access";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function ProtectedRoute({ children, accessKey }) {
  const { session, userData, pending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session || !userData || pending) return;

    if (userData.actif === false) {
      navigate("/blocked", { replace: true });
      return;
    }

    if (
      accessKey &&
      !hasAccess(userData.access_rights, accessKey, "peut_voir", userData.role === "superadmin")
    ) {
      navigate("/unauthorized", { replace: true });
    }
  }, [session, userData, pending, accessKey, navigate]);

  if (!session || pending || !userData) return <LoadingScreen />;
  return children;
}
