import { Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import PageSkeleton from "@/components/ui/PageSkeleton";

// Ce composant protège une route selon les droits retournés par useAuth().
// Il redirige vers /unauthorized si l'utilisateur n'a pas le droit de voir
// le module (moduleKey) ou si aucun droit n'est défini. Les états de chargement
// ou l'absence de session affichent un écran de chargement pour éviter les
// boucles d'effet.

export default function ProtectedRoute({ moduleKey, children }) {
  const { session, loading, userData } = useAuth();

  // Wait for session and user data to be fully loaded
  if (loading || !session || !userData || !userData.access_rights) {
    return <PageSkeleton />;
  }

  const access = userData.access_rights || {};
  const hasAccess = access[moduleKey]?.peut_voir === true;

  if (!userData.actif || !hasAccess) {
    console.warn("🔒 ACCESS DENIED for moduleKey:", moduleKey);
    console.warn("🔒 access_rights:", access);
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
