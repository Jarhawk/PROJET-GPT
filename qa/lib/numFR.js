export function toNumberFR(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const n = Number.parseFloat(normalized);
  return Number.isNaN(n) ? NaN : n;
}

export function fmtEUR(value) {
  const n = typeof value === 'number' ? value : toNumberFR(value);
  if (Number.isNaN(n)) return '0\u00a0€';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtPct(value) {
  const n = typeof value === 'number' ? value : toNumberFR(value);
  if (Number.isNaN(n)) return '0\u00a0%';
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
