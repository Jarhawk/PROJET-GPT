export function formatMoneyFR(value) {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value).replace(/[\u202F\u00A0]/g, ' ');
}

export function parseMoneyToNumberFR(str) {
  if (typeof str !== 'string') return 0;
  const cleaned = str
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  if (cleaned === '') return 0;
  const parts = cleaned.split('.');
  const last = parts.pop();
  const numberString = parts.length ? parts.join('') + '.' + last : last;
  const n = Number(numberString);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeDecimalFR(str) {
  if (typeof str !== 'string') return '';
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
