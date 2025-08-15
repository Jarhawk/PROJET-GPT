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
