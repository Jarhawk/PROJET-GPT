export function normalizeAccessKey(k) {
  if (!k) return null;
  const map = {
    fiches: 'fiches_techniques',
    engineering: 'analyse',
    menuEngineering: 'menu_engineering',
    menu_engineering: 'menu_engineering',
    costing: 'costing_carte',
  };
  const key = String(k).trim();
  return map[key] ?? key;
}

export function deduceEnabledModulesFromRights(rights) {
  if (!rights || typeof rights !== 'object') return {};
  const modules = {};
  for (const k of Object.keys(rights)) {
    if (k === 'enabledModules') continue;
    modules[k] = true;
  }
  return modules;
}

let cachedRights = null;

export function setAccessRights(rights) {
  cachedRights = rights;
}

// Retourne true/false pour une clé d'accès. Si aucun système de droits n'est
// configuré, la fonction renvoie toujours true afin de ne pas bloquer la navigation.
export function hasAccess(userOrKey, maybeKey) {
  if (typeof userOrKey === 'object') {
    const key = normalizeAccessKey(maybeKey);
    const rights = userOrKey?.access_rights || {};
    if (!key) return true;
    return !!rights[key];
  }

  const key = normalizeAccessKey(userOrKey);
  if (!key) return true;
  const rights = cachedRights || (typeof window !== 'undefined' ? window.APP_ACCESS_RIGHTS : null);
  if (!rights || typeof rights !== 'object') return true;
  return !!rights[key];
}

// Alias used by the new routing config
export function hasRight(...args) {
  return hasAccess(...args);
}

