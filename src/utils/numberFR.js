export function toNumberSafeFR(input) {
  if (typeof input !== 'string') return Number(input) || 0;
  const s = input.trim().replace(/\s/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
export function formatCurrencyEUR(n) {
  try { return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n ?? 0); }
  catch { return `${(n ?? 0).toFixed(2)} \u20AC`; }
}
export function formatPercent(delta) {
  const v = (delta ?? 0) * 100;
  return new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v) + ' %';
}
