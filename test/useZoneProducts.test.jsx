// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const successChain = {
  select: vi.fn(() => successChain),
  eq: vi.fn(() => successChain),
  order: vi.fn(() => successChain),
  update: vi.fn(() => successChain),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => successChain);
const rpcMock = vi.fn(() => Promise.resolve({ data: {}, error: null }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, rpc: rpcMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useZoneProducts;

beforeEach(async () => {
  ({ useZoneProducts } = await import('@/hooks/useZoneProducts'));
  fromMock.mockClear();
  successChain.select.mockClear();
  successChain.eq.mockClear();
  successChain.order.mockClear();
  successChain.update.mockClear();
  rpcMock.mockClear();
});

test('list queries produits filtered by zone', async () => {
  const { result } = renderHook(() => useZoneProducts());
  await act(async () => {
    await result.current.list('z1');
  });
  expect(fromMock).toHaveBeenCalledWith('produits');
  expect(successChain.select).toHaveBeenCalledWith(
    'id, nom, unite_id, stock_reel, stock_min'
  );
  expect(successChain.eq).toHaveBeenNthCalledWith(1, 'zone_stock_id', 'z1');
  expect(successChain.eq).toHaveBeenNthCalledWith(2, 'mama_id', 'm1');
  expect(successChain.order).toHaveBeenCalledWith('nom', { ascending: true });
});

test('move calls rpc with mama id', async () => {
  const { result } = renderHook(() => useZoneProducts());
  await act(async () => {
    await result.current.move('a', 'b', false);
  });
  expect(rpcMock).toHaveBeenCalledWith('move_zone_products', {
    p_mama: 'm1',
    p_src_zone: 'a',
    p_dest_zone: 'b',
    p_remove_src: false,
  });
});

test('copy calls rpc with mama id', async () => {
  const { result } = renderHook(() => useZoneProducts());
  await act(async () => {
    await result.current.copy('a', 'b', true);
  });
  expect(rpcMock).toHaveBeenCalledWith('copy_zone_products', {
    p_mama: 'm1',
    p_src_zone: 'a',
    p_dest_zone: 'b',
    p_overwrite: true,
  });
});

test('merge calls rpc with mama id', async () => {
  const { result } = renderHook(() => useZoneProducts());
  await act(async () => {
    await result.current.merge('a', 'b');
  });
  expect(rpcMock).toHaveBeenCalledWith('merge_zone_products', {
    p_mama: 'm1',
    p_src_zone: 'a',
    p_dest_zone: 'b',
  });
});
