// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  ilike: vi.fn(() => queryObj),
  insert: vi.fn(() => queryObj),
  update: vi.fn(() => queryObj),
  delete: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useAlerts;

beforeEach(async () => {
  ({ useAlerts } = await import('@/hooks/useAlerts'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.order.mockClear();
  queryObj.eq.mockClear();
  queryObj.ilike.mockClear();
  queryObj.insert.mockClear();
});

test('fetchRules queries regles_alertes with filters', async () => {
  const { result } = renderHook(() => useAlerts());
  await act(async () => { await result.current.fetchRules({ search: 'foo', actif: true }); });
  expect(fromMock).toHaveBeenCalledWith('regles_alertes');
  expect(queryObj.select).toHaveBeenCalledWith('*, produit:produit_id(id, nom)');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('actif', true);
  expect(queryObj.ilike).toHaveBeenCalledWith('produit.nom', '%foo%');
  expect(queryObj.order).toHaveBeenCalledWith('created_at', { ascending: false });
});

test('addRule inserts row with mama_id', async () => {
  const { result } = renderHook(() => useAlerts());
  await act(async () => { await result.current.addRule({ produit_id: 'p1', threshold: 2 }); });
  expect(queryObj.insert).toHaveBeenCalledWith([{ produit_id: 'p1', threshold: 2, mama_id: 'm1' }]);
});
