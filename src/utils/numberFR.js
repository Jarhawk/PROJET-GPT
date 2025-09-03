export function toNumberSafe(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return Number(value) || 0;
  const s = value.trim().replace(/\s/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export function formatEUR(n) {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(n ?? 0);
  } catch {
    return `${(n ?? 0).toFixed(2)} \u20AC`;
  }
}

export function formatPercent(v) {
  const n = v ?? 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export const toNumberSafeFR = toNumberSafe;
export const formatCurrencyEUR = formatEUR;
