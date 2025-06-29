// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rpcMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: rpcMock } }));

let useConsolidatedStats;

beforeEach(async () => {
  ({ useConsolidatedStats } = await import('@/hooks/useConsolidatedStats'));
  rpcMock.mockClear();
});

test('fetchStats calls consolidated_stats RPC', async () => {
  const { result } = renderHook(() => useConsolidatedStats());
  await act(async () => { await result.current.fetchStats(); });
  expect(rpcMock).toHaveBeenCalledWith('consolidated_stats');
});

test('fetchStats returns empty array on error', async () => {
  rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'bad' } });
  const { result } = renderHook(() => useConsolidatedStats());
  let data;
  await act(async () => { data = await result.current.fetchStats(); });
  expect(data).toEqual([]);
});
