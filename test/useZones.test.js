// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  ilike: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  range: vi.fn(() => queryObj),
  or: vi.fn(() => queryObj),
  then: fn => Promise.resolve(fn({ data: [], error: null, count: 0 })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));
vi.mock('react-hot-toast', () => ({ toast: { error: vi.fn() } }));

let useZones;

beforeEach(async () => {
  ({ useZones } = await import('@/hooks/useZones'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.ilike.mockClear();
  queryObj.order.mockClear();
  queryObj.range.mockClear();
});

test('fetchZones applies filters', async () => {
  queryObj.then = fn => Promise.resolve(fn({ data: [], error: null, count: 0 }));
  const { result } = renderHook(() => useZones());
  await act(async () => {
    await result.current.fetchZones({ search: 'cui', page: 2 });
  });
  expect(fromMock).toHaveBeenCalledWith('zones_stock');
  expect(queryObj.select).toHaveBeenCalledWith('*', { count: 'exact' });
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('actif', true);
  expect(queryObj.ilike).toHaveBeenCalledWith('nom', '%cui%');
  expect(queryObj.order).toHaveBeenCalledWith('nom', { ascending: true });
  expect(queryObj.range).toHaveBeenCalledWith(50, 99);
});

test('deleteZone stops when data exists', async () => {
  queryObj.then = fn => Promise.resolve(fn({ data: null, error: null, count: 1 }));
  const { result } = renderHook(() => useZones());
  let res;
  await act(async () => { res = await result.current.deleteZone('z'); });
  expect(fromMock).toHaveBeenCalledWith('requisitions');
  expect(res.error).toBeDefined();
});
