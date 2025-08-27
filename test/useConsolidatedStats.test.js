// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const selectMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));

let useConsolidatedStats;

beforeEach(async () => {
  ({ useConsolidatedStats } = await import('@/hooks/useConsolidatedStats'));
  fromMock.mockClear();
});

test('fetchStats selects v_mouvements_centres_cout_stats', async () => {
  const { result } = renderHook(() => useConsolidatedStats());
  await act(async () => { await result.current.fetchStats(); });
  expect(fromMock).toHaveBeenCalledWith('v_mouvements_centres_cout_stats');
});

test('fetchStats returns empty array on error', async () => {
  selectMock.mockResolvedValueOnce({ data: null, error: { message: 'bad' } });
  const { result } = renderHook(() => useConsolidatedStats());
  let data;
  await act(async () => { data = await result.current.fetchStats(); });
  expect(data).toEqual([]);
});
