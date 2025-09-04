// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  order: vi.fn(() => query),
  ilike: vi.fn(() => query),
  eq: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  then: fn => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let usePromotions;

beforeEach(async () => {
  ({ usePromotions } = await import('@/hooks/usePromotions'));
  fromMock.mockClear();
  query.select.mockClear();
  query.order.mockClear();
  query.ilike.mockClear();
  query.eq.mockClear();
  query.insert.mockClear();
  query.update.mockClear();
  query.delete.mockClear();
});

test('fetchPromotions filters by search and actif', async () => {
  const { result } = renderHook(() => usePromotions());
  await act(async () => {
    await result.current.fetchPromotions({ search: 'promo', actif: true });
  });
  expect(fromMock).toHaveBeenCalledWith('promotions');
  expect(query.select).toHaveBeenCalledWith('*', { count: 'exact' });
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.order).toHaveBeenCalledWith('date_debut', { ascending: false });
  expect(query.ilike).toHaveBeenCalledWith('nom', '%promo%');
  expect(query.eq).toHaveBeenCalledWith('actif', true);
});

test('addPromotion inserts row with mama_id', async () => {
  const { result } = renderHook(() => usePromotions());
  await act(async () => {
    await result.current.addPromotion({ nom: 'N' });
  });
  expect(query.insert).toHaveBeenCalledWith([{ nom: 'N', mama_id: 'm1' }]);
});

test('updatePromotion updates with id and mama_id', async () => {
  const { result } = renderHook(() => usePromotions());
  await act(async () => {
    await result.current.updatePromotion('id1', { nom: 'X' });
  });
  expect(query.update).toHaveBeenCalledWith({ nom: 'X' });
  expect(query.eq).toHaveBeenCalledWith('id', 'id1');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
});

test('deletePromotion deactivates with id and mama_id', async () => {
  const { result } = renderHook(() => usePromotions());
  await act(async () => {
    await result.current.deletePromotion('id1');
  });
  expect(query.update).toHaveBeenCalledWith({ actif: false });
  expect(query.eq).toHaveBeenCalledWith('id', 'id1');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
});
