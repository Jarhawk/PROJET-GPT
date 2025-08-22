export function normalizeNumberString(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, '').replace(',', '.');
}

export function parseNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const str = typeof value === 'number' ? String(value) : value;
  const normalized = normalizeNumberString(str);
  if (normalized === '') return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

export function formatNumberFR(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(value)
    .replace(/\s/g, ' ');
}
