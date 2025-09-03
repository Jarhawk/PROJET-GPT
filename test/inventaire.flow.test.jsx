import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test } from 'vitest';
import { useInventaires } from '@/hooks/useInventaires.js';

const qc = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

test('flow inventaire: fetch list', async () => {
  const { result } = renderHook(() => useInventaires(), { wrapper });
  await act(async () => {
    await result.current.getInventaires();
  });
  expect(Array.isArray(result.current.inventaires)).toBe(true);
});
