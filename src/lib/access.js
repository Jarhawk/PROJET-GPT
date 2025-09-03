export function hasAccess(requiredRight, rights) {
  // Pas de droit requis -> accessible
  if (!requiredRight) return true;
  // Profil pas encore chargé -> ne bloque pas l'affichage
  if (rights == null) return true;
  // Profil chargé mais sans droits -> bloque si droit requis
  if (!Array.isArray(rights) || rights.length === 0) return false;
  return rights.includes(requiredRight);
}

/**
 * canShowRoute(route, rights)
 * - Si route.access est défini, vérifie le droit correspondant dans rights.
 * - Si rights est null/undefined (chargement), retourne true pour éviter de masquer la Sidebar.
 */
export function canShowRoute(route, rights) {
  if (!route) return false;
  if (!route.access) return true;
  if (!rights) return true; // fallback pendant chargement pour éviter le flash/disparition
  return Boolean(rights[route.access] ?? (Array.isArray(rights) ? rights.includes(route.access) : false));
}
