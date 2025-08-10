// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rpcMock = vi.fn(() => Promise.resolve({ data: [{ cost_center_id: 'c1', nom: 'Food', ratio: 0.7 }], error: null }));

vi.mock('@/lib/supabase', () => ({ supabase: { rpc: rpcMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useCostCenterSuggestions;

beforeEach(async () => {
  ({ useCostCenterSuggestions } = await import('@/hooks/useCostCenterSuggestions'));
  rpcMock.mockClear();
});

test('fetchSuggestions calls RPC', async () => {
  const { result } = renderHook(() => useCostCenterSuggestions());
  await act(async () => {
    await result.current.fetchSuggestions('p1');
  });
  expect(rpcMock).toHaveBeenCalledWith('suggest_cost_centers', { p_produit_id: 'p1' });
  expect(result.current.suggestions).toEqual([{ cost_center_id: 'c1', nom: 'Food', ratio: 0.7 }]);
});
