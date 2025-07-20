export function normalizeRights(rights) {
  if (Array.isArray(rights)) return rights;
  if (rights && typeof rights === "object") {
    return Object.entries(rights)
      .filter(([, v]) => v === true || v?.peut_voir === true)
      .map(([k]) => k);
  }
  return [];
}

export function hasAccess(accessRights, module, right = "peut_voir", isSuperadmin = false) {
  if (!module) return false;
  if (isSuperadmin) return true;
  if (!accessRights || typeof accessRights !== "object") return false;
  const mod = accessRights[module];
  if (!mod || typeof mod !== "object") return false;
  return mod[right] === true;
}

export function getAuthorizedModules(accessRights, right = "peut_voir") {
  if (!accessRights || typeof accessRights !== "object") return [];
  return Object.entries(accessRights)
    .filter(([, v]) => v && v[right] === true)
    .map(([k]) => k);
}
