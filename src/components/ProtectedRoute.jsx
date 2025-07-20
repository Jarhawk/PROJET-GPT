import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasAccess } from "@/lib/utils";
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

    if (accessKey && !hasAccess(accessKey, userData.access_rights)) {
      navigate("/unauthorized", { replace: true });
    }
  }, [session, userData, pending, accessKey, navigate]);

  if (!session || pending || !userData) return <LoadingScreen />;
  return children;
}
