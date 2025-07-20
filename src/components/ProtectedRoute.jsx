// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { normalizeRights } from "@/lib/access";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import useConsentements from "@/hooks/useConsentements";

export default function ProtectedRoute({ children, accessKey }) {
  const {
    session,
    userData,
    loading,
    pending,
    access_rights,
    isSuperadmin,
    isAuthenticated,
    error,
  } = useAuth();
  const {
    consentements,
    loaded: consentLoaded,
    fetchConsentements,
  } = useConsentements();
  const location = useLocation();
  if (import.meta.env.DEV) {
    console.log("ProtectedRoute", {
      path: location.pathname,
      session: !!session,
      userDataLoaded: !!userData,
      pending,
    });
  }

  if (error) {
    console.error("Auth error:", error);
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (userData && !consentLoaded) {
    fetchConsentements();
  }

  if (loading || access_rights === null)
    return <LoadingSpinner message="Chargement..." />;

  if (pending === true) return <LoadingSpinner message="Chargement..." />;

  if (!session || !isAuthenticated) {
    if (location.pathname !== "/login")
      return <Navigate to="/login" replace />;
    return null;
  }

  if (!userData) {
    if (location.pathname !== "/unauthorized")
      return <Navigate to="/unauthorized" replace />;
    return null;
  }

  if (
    consentLoaded &&
    consentements.length === 0 &&
    location.pathname !== "/consentements"
  ) {
    return <Navigate to="/consentements" replace />;
  }

  if ((userData.role == null || userData.mama_id == null) &&
      location.pathname !== "/pending") {
    return <Navigate to="/pending" replace />;
  }

  if (userData?.actif === false && location.pathname !== "/blocked")
    return <Navigate to="/blocked" replace />;

  // Vérifie les droits si une clé est fournie
  if (accessKey) {
    const required = Array.isArray(accessKey) ? accessKey : [accessKey];
    const rights = normalizeRights(access_rights);
    const hasRight = (key) => isSuperadmin || rights.includes(key);

    const isAllowed = hasRight("parametrage") || required.some((k) => hasRight(k));

    if (!isAllowed && location.pathname !== "/unauthorized") {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (import.meta.env.DEV) {
    console.log("ProtectedRoute: access granted", {
      path: location.pathname,
      session: !!session,
      userDataLoaded: !!userData,
      pending,
    });
  }

  return children;
}
