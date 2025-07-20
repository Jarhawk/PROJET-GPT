import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasAccess } from "@/lib/utils";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function ProtectedRoute({ children, accessKey }) {
  const { session, userData, pending } = useAuth();

  useEffect(() => {
    if (!session || !userData || pending) return;

    const accessGranted = accessKey
      ? hasAccess(accessKey, userData?.access_rights)
      : true;
    const isActif = userData?.actif !== false;

    if (!accessGranted || !isActif) {
      window.location.href = "/unauthorized";
    }
  }, [session, userData, pending, accessKey]);

  if (pending || !userData) return <LoadingScreen />;
  return children;
}
