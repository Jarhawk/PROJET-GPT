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

export function formatMoneyEUR(v: number): string {
  if (!Number.isFinite(v)) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
}

export function formatQty(v: number): string {
  if (!Number.isFinite(v)) return '';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(v);
}

export function safeDiv(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return NaN;
  return a / b;
}
