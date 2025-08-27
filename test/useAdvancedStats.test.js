// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const orderMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const lteMock = vi.fn(() => ({ order: orderMock }));
const gteMock = vi.fn(() => ({ lte: lteMock, order: orderMock }));
const eqMock = vi.fn(() => ({ gte: gteMock, lte: lteMock, order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, gte: gteMock, lte: lteMock, order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: '1' }) }));

let useAdvancedStats;

beforeEach(async () => {
  ({ useAdvancedStats } = await import('@/hooks/useAdvancedStats'));
  fromMock.mockClear();
});

test('fetchStats selects v_achats_mensuels', async () => {
  const { result } = renderHook(() => useAdvancedStats());
  await act(async () => { await result.current.fetchStats({ start: '2024-01-01', end: '2024-12-31' }); });
  expect(fromMock).toHaveBeenCalledWith('v_achats_mensuels');
});

test('fetchStats returns empty on error', async () => {
  orderMock.mockResolvedValueOnce({ data: null, error: { message: 'err' } });
  const { result } = renderHook(() => useAdvancedStats());
  let data;
  await act(async () => { data = await result.current.fetchStats(); });
  expect(data).toEqual([]);
});
