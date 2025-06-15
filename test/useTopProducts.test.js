import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rpcMock = vi.fn(() => Promise.resolve({ data: [{ id: 'p1' }], error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: rpcMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useTopProducts;

beforeEach(async () => {
  ({ useTopProducts } = await import('@/hooks/useTopProducts'));
  rpcMock.mockClear();
});

test('fetchTop calls RPC with params', async () => {
  const { result } = renderHook(() => useTopProducts());
  await act(async () => {
    await result.current.fetchTop({ debut: '2024-01-01', fin: '2024-01-31', limit: 3 });
  });
  expect(rpcMock).toHaveBeenCalledWith('top_products', {
    mama_id_param: 'm1',
    debut_param: '2024-01-01',
    fin_param: '2024-01-31',
    limit_param: 3,
  });
});
