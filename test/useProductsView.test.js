import { renderHook, act } from '@testing-library/react';
import { beforeEach, test, expect } from 'vitest';

const supabase = globalThis.__SUPABASE_TEST_CLIENT__;
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProducts;

beforeEach(async () => {
  ({ useProducts } = await import('@/hooks/useProducts'));
  supabase.from.mockClear();
});

test('fetchProducts queries table with mama_id filter', async () => {
  const { result } = renderHook(() => useProducts());
  await act(async () => {
    await result.current.fetchProducts();
  });
  expect(supabase.from).toHaveBeenCalledWith('produits');
  const firstCall = supabase.from.mock.results[0]?.value;
  expect(firstCall.select).toHaveBeenCalled();
});
