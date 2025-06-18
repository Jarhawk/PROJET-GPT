import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const orderMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const queryChain = { select: vi.fn(() => queryChain), eq: vi.fn(() => queryChain), order: orderMock };
const fromMock = vi.fn(() => queryChain);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useInvoices;

beforeEach(async () => {
  ({ useInvoices } = await import('@/hooks/useInvoices'));
  fromMock.mockClear();
  queryChain.select.mockClear();
  queryChain.eq.mockClear();
  orderMock.mockClear();
});

test('fetchInvoicesBySupplier selects fields with aliases', async () => {
  const { result } = renderHook(() => useInvoices());
  await act(async () => {
    await result.current.fetchInvoicesBySupplier('s1');
  });
  expect(fromMock).toHaveBeenCalledWith('factures');
  expect(queryChain.select).toHaveBeenCalledWith('id, date_facture:date, numero_facture:reference, montant_total:montant, statut');
  expect(queryChain.eq).toHaveBeenNthCalledWith(1, 'mama_id', 'm1');
  expect(queryChain.eq).toHaveBeenNthCalledWith(2, 'fournisseur_id', 's1');
  expect(orderMock).toHaveBeenCalledWith('date', { ascending: false });
});
