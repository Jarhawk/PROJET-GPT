import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test } from 'vitest';
import { useFiches } from '@/hooks/useFiches.js';

const qc = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

test('flow fiches: fetch list', async () => {
  const { result } = renderHook(() => useFiches(), { wrapper });
  await act(async () => {
    await result.current.getFiches();
  });
  expect(Array.isArray(result.current.fiches)).toBe(true);
});
