// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ mama_id: 1 }),
}));

const orderMock = vi.fn();
const eqReturn2 = { order: orderMock };
const eqReturn1 = { eq: () => eqReturn2, order: orderMock };
const selectReturn = { eq: () => eqReturn1 };
const supabase = { from: vi.fn(() => ({ select: () => selectReturn })) };
vi.mock('@/lib/supabase', () => ({ supabase }));

let ComparatifPrix;
beforeEach(async () => {
  ({ default: ComparatifPrix } = await import('@/pages/fournisseurs/comparatif/ComparatifPrix.jsx'));
  orderMock.mockReset();
});

test('shows loader while fetching products', async () => {
  let resolve;
  orderMock.mockReturnValue(new Promise((r) => { resolve = r; }));
  const { queryByRole } = render(<ComparatifPrix />);
  expect(queryByRole('status')).toBeInTheDocument();
  resolve({ data: [], error: null });
  await waitFor(() => {
    expect(queryByRole('status')).not.toBeInTheDocument();
  });
});

test('displays error message when products fetch fails', async () => {
  orderMock.mockReturnValue(Promise.resolve({ data: null, error: { message: 'Oops' } }));
  render(<ComparatifPrix />);
  expect(await screen.findByText('Oops')).toBeInTheDocument();
});
