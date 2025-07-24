export function extractAccessRightsFromRole(role) {
  if (!role) return {};
  const rights = role.access_rights;
  if (typeof rights === 'string') {
    try {
      return JSON.parse(rights) || {};
    } catch (err) {
      console.error('Invalid role access_rights JSON', err);
      return {};
    }
  }
  if (rights && typeof rights === 'object') return rights;
  return {};
}
