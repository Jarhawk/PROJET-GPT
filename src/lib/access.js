export function normalizeRights(rights) {
  if (Array.isArray(rights)) return rights;
  if (rights && typeof rights === "object") {
    return Object.entries(rights)
      .filter(([, v]) => v === true || v?.peut_voir === true)
      .map(([k]) => k);
  }
  return [];
}

export function mergeRights(...rightsList) {
  const result = {};
  for (const rights of rightsList) {
    if (!rights || typeof rights !== "object") continue;
    for (const [mod, perms] of Object.entries(rights)) {
      if (!result[mod]) result[mod] = {};
      if (perms && typeof perms === "object") {
        result[mod] = { ...result[mod], ...perms };
      }
    }
  }
  return result;
}

export function rowsToRights(rows) {
  const res = {};
  (rows || []).forEach(r => {
    if (!res[r.module]) res[r.module] = {};
    res[r.module].peut_voir = r.peut_voir || false;
    res[r.module].peut_modifier = r.peut_modifier || false;
  });
  return res;
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
