// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  order: vi.fn(() => query),
  range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
  insert: vi.fn(() => query),
  single: vi.fn(() => ({ data: { id: '1' }, error: null })),
  update: vi.fn(() => query),
};
const fromMock = vi.fn(() => query);
const rpcMock = vi.fn(() => ({ data: null, error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, rpc: rpcMock } }));

let useCommandes;

beforeEach(async () => {
  ({ useCommandes } = await import('@/hooks/useCommandes'));
  fromMock.mockClear();
  rpcMock.mockClear();
  Object.values(query).forEach(fn => fn.mock && fn.mockClear && fn.mockClear());
});

test('getCommandes queries table', async () => {
  const { result } = renderHook(() => useCommandes());
  await act(async () => { await result.current.getCommandes({ fournisseur: 'f' }); });
  expect(fromMock).toHaveBeenCalledWith('commandes');
  expect(query.eq).toHaveBeenCalledWith('fournisseur_id', 'f');
});

test('insertCommande inserts header and lines', async () => {
  const { result } = renderHook(() => useCommandes());
  await act(async () => {
    await result.current.insertCommande({ date_commande: '2025-06-01', lignes: [{ produit_id: 'p', quantite: 1 }] });
  });
  expect(fromMock).toHaveBeenCalledWith('commandes');
  expect(query.insert).toHaveBeenCalled();
  expect(fromMock).toHaveBeenCalledWith('commande_lignes');
});
