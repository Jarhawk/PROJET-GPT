export function normalizeAccessKey(k) {
  if (!k) return null
  const map = {
    fiches: 'fiches_techniques',
    engineering: 'analyse',
    menuEngineering: 'menu_engineering',
    menu_engineering: 'menu_engineering',
    costing: 'costing_carte',
  }
  const key = String(k).trim()
  return map[key] ?? key
}

export function deduceEnabledModulesFromRights(rights) {
  if (!rights || typeof rights !== 'object') return {}
  const modules = {}
  for (const k of Object.keys(rights)) {
    if (k === 'enabledModules') continue
    modules[k] = true
  }
  return modules
}

export function hasAccess(user, accessKey) {
  if (!accessKey) return true
  const rights = user?.access_rights || {}
  const key = normalizeAccessKey(accessKey)
  return !!rights[key]
}

// Alias used by the new routing config
export function hasRight(user, access) {
  return hasAccess(user, access)
}
