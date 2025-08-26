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

export function formatCurrencyEUR(n: number): string {
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export function formatQty(v: number): string {
  if (!Number.isFinite(v)) return '';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(v);
}

export function formatPercent(delta: number): string {
  if (!Number.isFinite(delta)) return '';
  const sign = delta < 0 ? '-' : '';
  const abs = Math.abs(delta);
  const val = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${val}%`;
}

export function safeDiv(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return NaN;
  return a / b;
}
