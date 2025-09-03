export function hasAccess(requiredRight, rights) {
  // Pas de droit requis -> accessible
  if (!requiredRight) return true;
  // Profil pas encore chargé -> ne bloque pas l'affichage
  if (rights == null) return true;
  // Profil chargé mais sans droits -> bloque si droit requis
  if (!Array.isArray(rights) || rights.length === 0) return false;
  return rights.includes(requiredRight);
}
