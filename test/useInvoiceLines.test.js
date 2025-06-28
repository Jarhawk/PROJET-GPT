import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

let fromMock;
let query;

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

function setup() {
  query = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
    then: cb => Promise.resolve(cb({ data: { id: '1' }, error: null })),
  };
  fromMock = vi.fn(() => query);
  vi.mock('@/lib/supabase', () => ({ supabase: { from: (...args) => fromMock(...args) } }), { overwrite: true });
}

let useInvoiceLines;

beforeEach(async () => {
  setup();
  ({ useInvoiceLines } = await import('@/hooks/useInvoiceLines'));
  fromMock.mockClear();
});

test('addLine verifies invoice and inserts', async () => {
  const { result } = renderHook(() => useInvoiceLines());
  await act(async () => {
    await result.current.addLine('1', { product_id: 'p', quantite: 1 });
  });
  expect(fromMock).toHaveBeenCalledWith('factures');
  expect(fromMock).toHaveBeenCalledWith('facture_lignes');
});
