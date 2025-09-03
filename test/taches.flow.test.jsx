import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test } from 'vitest';
import { useTaches } from '@/hooks/useTaches.js';

const qc = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

test('flow taches: create and fetch', async () => {
  const supabase = globalThis.__SUPABASE_TEST_CLIENT__;
  supabase.from.mockClear();
  const { result } = renderHook(() => useTaches(), { wrapper });
  await act(async () => {
    await result.current.fetchTaches();
  });
  expect(Array.isArray(result.current.taches)).toBe(true);
  await act(async () => {
    await result.current.createTache({ titre: 'Test', description: 'x' });
  });
  expect(supabase.from).toHaveBeenCalledWith('taches');
});
