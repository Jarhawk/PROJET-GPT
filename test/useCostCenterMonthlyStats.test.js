import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  eq: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  gte: vi.fn(() => queryObj),
  lte: vi.fn(() => queryObj),
  then: vi.fn(f => Promise.resolve(f({ data: [], error: null }))),
};
const selectMock = vi.fn(() => queryObj);
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useCostCenterMonthlyStats;

beforeEach(async () => {
  ({ useCostCenterMonthlyStats } = await import('@/hooks/useCostCenterMonthlyStats'));
  fromMock.mockClear();
  selectMock.mockClear();
});

test('fetchMonthly queries view with mama_id', async () => {
  const { result } = renderHook(() => useCostCenterMonthlyStats());
  await act(async () => {
    await result.current.fetchMonthly();
  });
  expect(fromMock).toHaveBeenCalledWith('v_cost_center_monthly');
});
