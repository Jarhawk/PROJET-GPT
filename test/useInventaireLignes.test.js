// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  order: vi.fn(() => query),
  range: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  single: vi.fn(() => query),
  maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'inv1' }, error: null })),
  then: fn => Promise.resolve(fn({ data: [], count: 0, error: null })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useInventaireLignes;

beforeEach(async () => {
  ({ useInventaireLignes } = await import('@/hooks/useInventaireLignes'));
  fromMock.mockClear();
  query.select.mockClear();
  query.eq.mockClear();
  query.order.mockClear();
  query.range.mockClear();
  query.insert.mockClear();
  query.update.mockClear();
  query.delete.mockClear();
});

test('fetchLignes applies filters and pagination', async () => {
  const { result } = renderHook(() => useInventaireLignes());
  await act(async () => {
    await result.current.fetchLignes({ inventaireId: 'inv1', page: 2, limit: 10 });
  });
  expect(fromMock).toHaveBeenCalledWith('produits_inventaire');
  expect(query.select).toHaveBeenCalledWith('*', { count: 'exact' });
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('inventaire_id', 'inv1');
  expect(query.order).toHaveBeenCalled();
  expect(query.range).toHaveBeenCalledWith(10, 19);
});

test('createLigne inserts with mama_id', async () => {
  const { result } = renderHook(() => useInventaireLignes());
  await act(async () => {
    await result.current.createLigne({ inventaire_id: 'inv1', produit_id: 'p1', quantite_reelle: 1 });
  });
  expect(fromMock).toHaveBeenCalledWith('inventaires');
  expect(fromMock).toHaveBeenCalledWith('produits_inventaire');
  expect(query.insert).toHaveBeenCalledWith([{ inventaire_id: 'inv1', produit_id: 'p1', quantite_reelle: 1, mama_id: 'm1' }]);
});

test('updateLigne updates with id and mama_id', async () => {
  const { result } = renderHook(() => useInventaireLignes());
  await act(async () => {
    await result.current.updateLigne('l1', { quantite_reelle: 5 });
  });
  expect(query.update).toHaveBeenCalledWith({ quantite_reelle: 5 });
  expect(query.eq).toHaveBeenCalledWith('id', 'l1');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
});

test('deleteLigne deletes with id and mama_id', async () => {
  const { result } = renderHook(() => useInventaireLignes());
  await act(async () => {
    await result.current.deleteLigne('l1');
  });
  expect(query.update).toHaveBeenCalledWith({ actif: false });
  expect(query.eq).toHaveBeenCalledWith('id', 'l1');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
});

test('getLigne selects by id', async () => {
  const { result } = renderHook(() => useInventaireLignes());
  await act(async () => {
    await result.current.getLigne('l2');
  });
  expect(fromMock).toHaveBeenCalledWith('produits_inventaire');
  expect(query.select).toHaveBeenCalledWith('*');
  expect(query.eq).toHaveBeenCalledWith('id', 'l2');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
});
