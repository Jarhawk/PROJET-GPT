// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  then: fn => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

let useZones;

beforeEach(async () => {
  ({ useZones } = await import('@/hooks/useZones'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.order.mockClear();
});

test('fetchZones returns zones sorted by position', async () => {
  const unsorted = [
    { id: 'b', nom: 'B', position: 2 },
    { id: 'a', nom: 'A', position: 0 },
    { id: 'c', nom: 'C', position: 1 },
  ];
  queryObj.then = fn => Promise.resolve(fn({ data: unsorted, error: null }));
  const { result } = renderHook(() => useZones());
  let zones;
  await act(async () => {
    zones = await result.current.fetchZones();
  });
  expect(queryObj.select).toHaveBeenCalledWith('id, nom, type, parent_id, position, actif, created_at');
  expect(queryObj.order).toHaveBeenNthCalledWith(1, 'position', { ascending: true });
  expect(queryObj.order).toHaveBeenNthCalledWith(2, 'nom');
  expect(zones.map(z => z.id)).toEqual(['a', 'c', 'b']);
});
