import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import { makeSupabaseMock } from './mocks/supabaseClient.js';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProducts;
let client;

beforeEach(async () => {
  globalThis.__SUPABASE_TEST_CLIENT__ = makeSupabaseMock({ data: [], count: 0, error: null });
  client = globalThis.__SUPABASE_TEST_CLIENT__;
  ({ useProducts } = await import('@/hooks/useProducts'));
  vi.clearAllMocks();
});

test('fetchProducts queries table with mama_id filter', async () => {
  const { result } = renderHook(() => useProducts());
  await act(async () => {
    await result.current.fetchProducts();
  });
  expect(client.from).toHaveBeenCalledWith('produits');
  const query = client.from.mock.results[0].value;
  expect(query.select).toHaveBeenCalled();
});
