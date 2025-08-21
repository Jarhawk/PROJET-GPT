import { describe, expect, test } from 'vitest';
import { normalizeNumberString, parseNumber, formatNumberFR } from '../number';

describe('utils/number', () => {
  test('normalizeNumberString', () => {
    expect(normalizeNumberString('1 234,56')).toBe('1234.56');
    expect(normalizeNumberString('12.34')).toBe('12.34');
  });

  test('parseNumber', () => {
    expect(parseNumber('1 234,56')).toBeCloseTo(1234.56);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });

  test('formatNumberFR', () => {
    expect(formatNumberFR(1234.5)).toBe('1 234,50');
    expect(formatNumberFR(null)).toBe('');
  });
});
