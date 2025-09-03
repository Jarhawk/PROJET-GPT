import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { makeSupabaseMock } from './mocks/supabaseClient.js';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProducts;
let client;
let wrapper;

beforeEach(async () => {
  globalThis.__SUPABASE_TEST_CLIENT__ = makeSupabaseMock({ data: [], count: 0, error: null });
  client = globalThis.__SUPABASE_TEST_CLIENT__;
  ({ useProducts } = await import('@/hooks/useProducts'));
  const queryClient = new QueryClient();
  wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  vi.clearAllMocks();
});

test('fetchProducts queries table with mama_id filter', async () => {
  const { result } = renderHook(() => useProducts(), { wrapper });
  await act(async () => {
    await result.current.fetchProducts();
  });
  expect(client.from).toHaveBeenCalledWith('produits');
  const query = client.from.mock.results[0].value;
  expect(query.select).toHaveBeenCalled();
});
