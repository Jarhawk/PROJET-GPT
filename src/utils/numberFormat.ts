export function formatMoneyFR(n: number | string, opts?: Intl.NumberFormatOptions): string {
  const value = typeof n === 'string' ? Number(n) : n;
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  });
  return formatter.format(value).replace(/[\u202F\u00A0]/g, ' ');
}

export function parseMoneyToNumberFR(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  const cleaned = v
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  if (cleaned === '') return 0;
  const parts = cleaned.split('.');
  const last = parts.pop() as string;
  const numberString = parts.length ? parts.join('') + '.' + last : last;
  const n = Number(numberString);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeDecimalFR(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const str = typeof v === 'number' ? String(v) : v;
  const replaced = str
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, ',');
  let result = '';
  let commaUsed = false;
  for (const ch of replaced) {
    if (/\d/.test(ch)) {
      result += ch;
    } else if (ch === ',' && !commaUsed) {
      result += ',';
      commaUsed = true;
    }
  }
  return result;
}

export function roundTo(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

