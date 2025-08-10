// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import { TABLES } from '@/constants/tables';

const eqMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const rpcMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, rpc: rpcMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', loading: false }) }));

let useDashboard;

beforeEach(async () => {
  ({ useDashboard } = await import('@/hooks/useDashboard'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  rpcMock.mockClear();
});

test('fetchDashboard queries products and requisition lines and calls RPC', async () => {
  const { result } = renderHook(() => useDashboard());
  await act(async () => {
    await result.current.fetchDashboard(1000);
  });
  expect(fromMock).toHaveBeenCalledWith('v_produits_dernier_prix');
  expect(fromMock).toHaveBeenCalledWith(TABLES.MOUVEMENTS);
  expect(rpcMock).toHaveBeenCalledWith('top_produits', expect.any(Object));
});
