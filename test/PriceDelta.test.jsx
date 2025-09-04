import { render } from '@testing-library/react';
import { test, expect } from 'vitest';
import PriceDelta from '@/components/factures/PriceDelta';

test('PriceDelta icon varies with puHT and pmp', () => {
  const { getByLabelText, rerender } = render(<PriceDelta puHT={12} pmp={10} />);
  expect(getByLabelText(/supérieur/)).toBeTruthy();
  rerender(<PriceDelta puHT={8} pmp={10} />);
  expect(getByLabelText(/inférieur/)).toBeTruthy();
  rerender(<PriceDelta puHT={10} pmp={10} />);
  expect(getByLabelText(/égal/)).toBeTruthy();
});
