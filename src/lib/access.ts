export function normalizeAccessKey(k?: string | null) {
  if (!k) return null
  const map: Record<string, string> = {
    // alias -> clé réelle dans access_rights
    fiches: 'fiches_techniques',
    engineering: 'analyse',
    menuEngineering: 'menu_engineering',
    menu_engineering: 'menu_engineering',
    costing: 'costing_carte',
  }
  const key = String(k).trim()
  return map[key] ?? key
}

export function deduceEnabledModulesFromRights(rights?: Record<string, any> | null) {
  if (!rights || typeof rights !== 'object') return {}
  const modules: Record<string, boolean> = {}
  for (const k of Object.keys(rights)) {
    if (k === 'enabledModules') continue
    modules[k] = true
  }
  return modules
}
