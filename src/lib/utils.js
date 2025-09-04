export function hasAccess(module, access_rights) {
  if (!access_rights || typeof access_rights !== "object") return false;
  const mod = access_rights[module];
  if (!mod || typeof mod !== "object") return false;
  return mod.peut_voir === true || mod === true;
}
