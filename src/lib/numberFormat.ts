export function parseDecimal(input: string | number): number {
  if (input === null || input === undefined) return NaN;
  if (typeof input === 'number') return input;
  const s = String(input).trim().replace(/\u00A0/g, ' ');
  if (!s) return NaN;
  const normalized = s
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^0-9.\-]/g, '');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export function toNumberSafe(input: string | number, locale = 'fr-FR'): number {
  if (input === null || input === undefined) return NaN;
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;
  let s = String(input).trim().replace(/\u00A0/g, ' ');
  if (locale === 'fr-FR') s = s.replace(/\s/g, '').replace(/,/g, '.');
  else s = s.replace(/\s/g, '');
  s = s.replace(/[^0-9.\-]/g, '');
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

export function formatMoneyEUR(v: number): string {
  if (!Number.isFinite(v)) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
}

export const formatCurrencyEUR = (v: number) => formatMoneyEUR(v);

export function formatQty(v: number): string {
  if (!Number.isFinite(v)) return '';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(v);
}

export function formatPercent(v: number): string {
  if (!Number.isFinite(v)) return '';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function safeDiv(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return NaN;
  return a / b;
}
