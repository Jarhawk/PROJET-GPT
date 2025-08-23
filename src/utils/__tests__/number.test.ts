import { describe, expect, test } from 'vitest';
import { formatEUR, formatQty, parseEUFloat } from '../number';

describe('utils/number', () => {
  test('parseEUFloat', () => {
    expect(parseEUFloat('1 234,56')).toBeCloseTo(1234.56);
    expect(parseEUFloat('')).toBeNull();
    expect(parseEUFloat('abc')).toBeNull();
  });

  test('formatEUR', () => {
    const formatted = formatEUR(1234.5);
    expect(formatted.includes('1')).toBe(true);
    expect(formatEUR(null)).toBe('—');
  });

  test('formatQty', () => {
    expect(formatQty(1234.56, 2)).toBe('1 234,56');
    expect(formatQty(null)).toBe('—');
  });
});
