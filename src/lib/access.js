export function normalizeRights(rights) {
  if (Array.isArray(rights)) return rights;
  if (rights && typeof rights === "object") {
    return Object.entries(rights)
      .filter(([, v]) => v === true || v?.peut_voir === true)
      .map(([k]) => k);
  }
  return [];
}

export function hasAccess(rights, key, isSuperadmin = false) {
  if (!key) return false;
  return isSuperadmin || normalizeRights(rights).includes(key);
}
