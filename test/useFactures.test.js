// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  ilike: vi.fn(() => query),
  order: vi.fn(() => query),
  range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
  insert: vi.fn(() => query),
  single: vi.fn(() => ({ data: { id: '1' }, error: null })),
  in: vi.fn(() => query),
  update: vi.fn(() => query),
};
const fromMock = vi.fn(() => query);
const rpcMock = vi.fn(() => ({ data: null, error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, rpc: rpcMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useFactures;

beforeEach(async () => {
  ({ useFactures } = await import('@/hooks/useFactures'));
  fromMock.mockClear();
  Object.values(query).forEach(fn => fn.mock && fn.mockClear && fn.mockClear());
  rpcMock.mockClear();
});

test('getBonsLivraison queries table', async () => {
  const { result } = renderHook(() => useFactures());
  await act(async () => { await result.current.getBonsLivraison({ search: 'x' }); });
  expect(fromMock).toHaveBeenCalledWith('bons_livraison');
  expect(query.ilike).toHaveBeenCalledWith('numero_bl', '%x%');
});

test('createBonLivraison inserts header and lines', async () => {
  const { result } = renderHook(() => useFactures());
  await act(async () => {
    await result.current.createBonLivraison({ numero_bl: 'B1', date_livraison: '2025-06-01', lignes: [{ produit_id: 'p', qte: 1 }] });
  });
  expect(fromMock).toHaveBeenCalledWith('bons_livraison');
  expect(query.insert).toHaveBeenCalled();
  expect(fromMock).toHaveBeenCalledWith('lignes_bl');
});

test('updateStock calls RPC', async () => {
  const { result } = renderHook(() => useFactures());
  await act(async () => { await result.current.updateStock('1', 'bl'); });
  expect(rpcMock).toHaveBeenCalledWith('apply_stock_from_achat', {
    achat_id: '1',
    achat_table: 'bons_livraison',
    mama_id: 'm1',
  });
});
