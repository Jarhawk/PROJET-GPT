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

  if (loading || !session || !userData) {
    return <PageSkeleton />;
  }

  if (userData.actif === false) {
    return <Navigate to="/unauthorized" />;
  }

  const rights = userData.access_rights || {};
  const hasAccess =
    rights[moduleKey]?.peut_voir === true || rights[moduleKey] === true;

  if (!hasAccess) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
