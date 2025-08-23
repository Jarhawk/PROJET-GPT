import { formatMoneyFR, parseMoneyToNumberFR, normalizeDecimalFR } from '../numberFormat';

describe('numberFormat', () => {
  test('formatMoneyFR', () => {
    expect(formatMoneyFR(0)).toBe('0,00 €');
    expect(formatMoneyFR(1205)).toBe('1 205,00 €');
    expect(formatMoneyFR(1205.5)).toBe('1 205,50 €');
  });

  test('parseMoneyToNumberFR', () => {
    expect(parseMoneyToNumberFR('')).toBe(0);
    expect(parseMoneyToNumberFR('0')).toBe(0);
    expect(parseMoneyToNumberFR('1 205,00 €')).toBe(1205);
    expect(parseMoneyToNumberFR('1 205,50 €')).toBe(1205.5);
    expect(parseMoneyToNumberFR('1 205.5 €')).toBe(1205.5);
  });

  test('normalizeDecimalFR', () => {
    expect(normalizeDecimalFR('')).toBe('');
    expect(normalizeDecimalFR('0')).toBe('0');
    expect(normalizeDecimalFR('1 205,00 €')).toBe('1205,00');
    expect(normalizeDecimalFR('1 205,50 €')).toBe('1205,50');
    expect(normalizeDecimalFR('1 205.5 €')).toBe('1205,5');
  });
});
