import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rpcMock = vi.fn(() => Promise.resolve({ data: [], error: null }));

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: rpcMock }
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useCostCenterStats;

beforeEach(async () => {
  ({ useCostCenterStats } = await import('@/hooks/useCostCenterStats'));
  rpcMock.mockClear();
});

test('fetchStats calls stats_cost_centers RPC', async () => {
  const { result } = renderHook(() => useCostCenterStats());
  await act(async () => {
    await result.current.fetchStats();
  });
  expect(rpcMock).toHaveBeenCalledWith('stats_cost_centers', {
    mama_id_param: 'm1',
    debut_param: null,
    fin_param: null,
  });
});

test('fetchStats returns empty array on error', async () => {
  rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'bad' } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const { result } = renderHook(() => useCostCenterStats());
  let data;
  await act(async () => {
    data = await result.current.fetchStats();
  });
  expect(data).toEqual([]);
  expect(console.error).toHaveBeenCalledWith(
    'Failed to fetch cost center stats',
    { message: 'bad' }
  );
  console.error.mockRestore();
});

