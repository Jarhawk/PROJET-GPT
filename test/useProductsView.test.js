import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rangeMock = vi.fn(() => Promise.resolve({ data: [], count: 0, error: null }));
const orderMock2 = vi.fn(() => ({ range: rangeMock }));
const orderMock1 = vi.fn(() => ({ order: orderMock2 }));
const eqMock = vi.fn(() => ({ order: orderMock1 }));
const selectMock = vi.fn(() => ({ eq: eqMock, order: orderMock1, range: rangeMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProducts;

beforeEach(async () => {
  ({ useProducts } = await import('@/hooks/useProducts'));
  fromMock.mockClear();
  selectMock.mockClear();
});

test('fetchProducts queries view with mama_id filter', async () => {
  const { result } = renderHook(() => useProducts());
  await act(async () => {
    await result.current.fetchProducts();
  });
  expect(fromMock).toHaveBeenCalledWith('v_produits_dernier_prix');
  expect(selectMock).toHaveBeenCalled();
});
