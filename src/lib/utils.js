export function hasAccess(module, access_rights) {
  if (!access_rights) return false;
  if (Array.isArray(access_rights)) return access_rights.includes(module);
  if (typeof access_rights === "object") {
    return Boolean(access_rights[module]);
  }
  return false;
}
