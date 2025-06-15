import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  order: vi.fn(() => Promise.resolve({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useFournisseurTotals;

beforeEach(async () => {
  ({ useFournisseurTotals } = await import('@/hooks/useFournisseurTotals'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.order.mockClear();
});

test('fetchTotals queries view with mama_id', async () => {
  const { result } = renderHook(() => useFournisseurTotals());
  await act(async () => {
    await result.current.fetchTotals();
  });
  expect(fromMock).toHaveBeenCalledWith('v_fournisseur_totaux');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
});
