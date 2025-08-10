export function can(rights = {}, module, action = "read", role = null) {
  if (role === "admin") return true;
  const mod = rights?.[module];
  if (!mod) return false;
  return !!mod[action];
}
