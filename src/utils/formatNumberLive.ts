export type FormatLiveOptions = {
  type: 'qty' | 'money';
  locale?: string;
};

export function formatNumberLive(
  input: HTMLInputElement,
  { type, locale = (typeof navigator !== 'undefined' ? navigator.language : 'fr-FR') }: FormatLiveOptions
): number | null {
  const raw = input.value;
  const selection = input.selectionStart ?? raw.length;

  const cleaned = raw.replace(/[^0-9.,-]/g, '').replace(',', '.');
  if (cleaned === '') {
    input.value = '';
    return null;
  }
  const num = Number(cleaned);
  if (!Number.isFinite(num)) {
    input.value = '';
    return null;
  }

  const formatter =
    type === 'money'
      ? new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : new Intl.NumberFormat(locale, {
          maximumFractionDigits: 6,
        });
  const formatted = formatter.format(num);

  const digitsBefore = raw.slice(0, selection).replace(/\D/g, '').length;
  input.value = formatted;
  let caret = 0;
  let digits = 0;
  while (caret < formatted.length && digits < digitsBefore) {
    if (/\d/.test(formatted[caret])) digits++;
    caret++;
  }
  input.setSelectionRange(caret, caret);

  return num;
}
