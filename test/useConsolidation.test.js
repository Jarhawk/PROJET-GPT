import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  in: vi.fn(() => queryObj),
  gte: vi.fn(() => queryObj),
  lte: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));

let useConsolidation;

beforeEach(async () => {
  ({ useConsolidation } = await import('@/hooks/useConsolidation'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.in.mockClear();
  queryObj.gte.mockClear();
  queryObj.lte.mockClear();
});

test('fetchSites queries mapping table', async () => {
  const { result } = renderHook(() => useConsolidation());
  await act(async () => { await result.current.fetchSites(); });
  expect(fromMock).toHaveBeenCalledWith('user_mama_access');
  expect(queryObj.select).toHaveBeenCalledWith('mama_id, role');
});

test('fetchConsoMensuelle filters by ids and period', async () => {
  const { result } = renderHook(() => useConsolidation());
  await act(async () => {
    await result.current.fetchConsoMensuelle({ mamaIds: ['m1','m2'], start: '2024-01-01', end: '2024-02-01' });
  });
  expect(fromMock).toHaveBeenCalledWith('v_consolidation_mensuelle');
  expect(queryObj.in).toHaveBeenCalledWith('mama_id', ['m1','m2']);
  expect(queryObj.gte).toHaveBeenCalledWith('mois', '2024-01-01');
  expect(queryObj.lte).toHaveBeenCalledWith('mois', '2024-02-01');
});
