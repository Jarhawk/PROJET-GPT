// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const orderMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const queryChain = { select: vi.fn(() => queryChain), eq: vi.fn(() => queryChain), order: orderMock };
const fromMock = vi.fn(() => queryChain);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useInvoices;

beforeEach(async () => {
  ({ useInvoices } = await import('@/hooks/useInvoices'));
  fromMock.mockClear();
  queryChain.select.mockClear();
  queryChain.eq.mockClear();
  orderMock.mockClear();
});

test('fetchFacturesByFournisseur selects fields with aliases', async () => { // ✅ Correction Codex
  const { result } = renderHook(() => useInvoices());
  await act(async () => {
    await result.current.fetchFacturesByFournisseur('s1'); // ✅ Correction Codex
  });
  expect(fromMock).toHaveBeenCalledWith('factures');
  expect(queryChain.select).toHaveBeenCalledWith('id, date_facture, numero, total_ttc, statut');
  expect(queryChain.eq).toHaveBeenNthCalledWith(1, 'mama_id', 'm1');
  expect(queryChain.eq).toHaveBeenNthCalledWith(2, 'fournisseur_id', 's1');
  expect(orderMock).toHaveBeenCalledWith('date_facture', { ascending: false });
});
