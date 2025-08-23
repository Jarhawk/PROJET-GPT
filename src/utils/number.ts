export const formatEUR = (n?: number | null) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? '—'
    : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export const formatQty = (n?: number | null, max = 3) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? '—'
    : n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: max });

/** Parse une entrée utilisateur FR (accepte espace, . ,) en nombre JS ou null */
export const parseEUFloat = (raw: string): number | null => {
  if (!raw) return null;
  const s = raw
    .replace(/\s/g, '')
    .replace(/ /g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.-]/g, '');
  if (s === '' || s === '-' || s === '.' || s === '-.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
