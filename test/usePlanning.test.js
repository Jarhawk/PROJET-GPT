import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  gte: vi.fn(() => queryObj),
  lte: vi.fn(() => queryObj),
  then: undefined,
};
queryObj.then = (fn) => Promise.resolve(fn({ data: [], error: null }));
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let usePlanning;

beforeEach(async () => {
  ({ usePlanning } = await import('@/hooks/usePlanning'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.order.mockClear();
  queryObj.eq.mockClear();
  queryObj.gte.mockClear();
  queryObj.lte.mockClear();
});

test('fetchPlanning queries with filters', async () => {
  const { result } = renderHook(() => usePlanning());
  await act(async () => {
    await result.current.fetchPlanning({ start: '2024-01-01', end: '2024-01-31' });
  });
  expect(fromMock).toHaveBeenCalledWith('planning_previsionnel');
  expect(queryObj.select).toHaveBeenCalledWith('*');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.order).toHaveBeenCalledWith('date_prevue', { ascending: true });
  expect(queryObj.gte).toHaveBeenCalledWith('date_prevue', '2024-01-01');
  expect(queryObj.lte).toHaveBeenCalledWith('date_prevue', '2024-01-31');
});

test('fetchPlanning returns empty on error', async () => {
  queryObj.then = (fn) => Promise.resolve(fn({ data: null, error: { message: 'err' } }));
  const { result } = renderHook(() => usePlanning());
  let data;
  await act(async () => { data = await result.current.fetchPlanning(); });
  expect(data).toEqual([]);
});
