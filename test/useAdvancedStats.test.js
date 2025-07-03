// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rpcMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: rpcMock } }));

let useAdvancedStats;

beforeEach(async () => {
  ({ useAdvancedStats } = await import('@/hooks/useAdvancedStats'));
  rpcMock.mockClear();
});

test('fetchStats calls advanced_stats RPC', async () => {
  const { result } = renderHook(() => useAdvancedStats());
  await act(async () => { await result.current.fetchStats({ start: '2024-01-01', end: '2024-12-31' }); });
  expect(rpcMock).toHaveBeenCalledWith('advanced_stats', { start_date: '2024-01-01', end_date: '2024-12-31' });
});

test('fetchStats returns empty on error', async () => {
  rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'err' } });
  const { result } = renderHook(() => useAdvancedStats());
  let data;
  await act(async () => { data = await result.current.fetchStats(); });
  expect(data).toEqual([]);
});
