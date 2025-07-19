import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', isSuperadmin: false }) }));

let useConsolidation;

beforeEach(async () => {
  ({ useConsolidation } = await import('@/hooks/useConsolidation'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
});

test('fetchStats queries view with mama_id filter', async () => {
  const { result } = renderHook(() => useConsolidation());
  await act(async () => { await result.current.fetchStats(); });
  expect(fromMock).toHaveBeenCalledWith('v_consolidated_stats');
  expect(queryObj.select).toHaveBeenCalledWith('*');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
});
