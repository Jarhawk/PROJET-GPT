import { Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { MODULE_KEYS, PUBLIC_MODULES } from "@/constants/accessKeys";

// Ce composant protège une route selon les droits retournés par useAuth().
// Il redirige vers /unauthorized si l'utilisateur n'a pas le droit de voir
// le module (moduleKey) ou si aucun droit n'est défini. Les états de chargement
// ou l'absence de session affichent un écran de chargement pour éviter les
// boucles d'effet.

export default function ProtectedRoute({ moduleKey, children, strict = false }) {
  const { session, loading, userData } = useAuth();

  // Wait for session and user data to be fully loaded
  if (loading || !session || !userData || !userData.access_rights) {
    return <PageSkeleton />;
  }

  const access = userData.access_rights || {};
  const moduleDefined = Object.prototype.hasOwnProperty.call(access, moduleKey);
  const hasAccess = access[moduleKey]?.peut_voir === true;

  if (!MODULE_KEYS.includes(moduleKey) && !PUBLIC_MODULES.includes(moduleKey)) {
    console.warn(`⚠️ Unknown moduleKey '${moduleKey}' used in <ProtectedRoute>`);
  }

  if (!userData.actif) {
    return <Navigate to="/unauthorized" />;
  }

  if (!moduleDefined) {
    const msg = `⚠️ moduleKey '${moduleKey}' missing in access_rights`;
    if (strict && !PUBLIC_MODULES.includes(moduleKey)) {
      console.warn(`${msg} (strict mode)`);
      return <Navigate to="/unauthorized" />;
    }
    if (import.meta.env.DEV) console.warn(msg);
    // allow access by default for unknown module keys
    return children;
  }

  if (!hasAccess && !PUBLIC_MODULES.includes(moduleKey)) {
    console.warn("🔒 ACCESS DENIED for moduleKey:", moduleKey);
    console.warn("🔒 access_rights:", access);
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
