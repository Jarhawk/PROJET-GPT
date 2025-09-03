import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test } from 'vitest';
import { useMenus } from '@/hooks/useMenus.js';

const qc = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

test('flow menus: fetch list', async () => {
  const { result } = renderHook(() => useMenus(), { wrapper });
  await act(async () => {
    await result.current.getMenus();
  });
  expect(Array.isArray(result.current.menus)).toBe(true);
});
