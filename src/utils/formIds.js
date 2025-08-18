// Nettoie une chaîne pour usage en id HTML
const sanitize = (str = '') =>
  str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // retire accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')    // remplace espaces & spéciaux par -
    .replace(/^-+|-+$/g, '');       // retire tirets en bord

export function idFromLabel(label, prefix = 'fld') {
  const base = sanitize(String(label || ''));
  if (base) return `${prefix}-${base}`;
  // fallback ultra court si label vide
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

// (optionnel) export par défaut pour d’autres imports
export default { idFromLabel };
