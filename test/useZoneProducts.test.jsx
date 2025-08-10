// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const successChain = {
  select: vi.fn(() => successChain),
  eq: vi.fn(() => successChain),
  then: fn => Promise.resolve(fn({ data: [], error: null })),
};
const errorChain = {
  select: vi.fn(() => errorChain),
  eq: vi.fn(() => errorChain),
  then: fn => Promise.resolve(fn({ data: null, error: { code: '42P01', message: 'missing' } })),
};
const fromMock = vi.fn(() => successChain);
const rpcMock = vi.fn(() => Promise.resolve({ data: {}, error: null }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, rpc: rpcMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));
vi.mock('react-hot-toast', () => ({ toast: { error: vi.fn() } }));

let useZoneProducts;

beforeEach(async () => {
  ({ useZoneProducts } = await import('@/hooks/useZoneProducts'));
  fromMock.mockClear();
  successChain.select.mockClear();
  successChain.eq.mockClear();
  errorChain.select.mockClear();
  errorChain.eq.mockClear();
  rpcMock.mockClear();
});

test('list queries view filtered by zone', async () => {
  fromMock.mockImplementation(() => successChain);
  const { result } = renderHook(() => useZoneProducts());
  await act(async () => {
    await result.current.list('z1');
  });
  expect(fromMock).toHaveBeenCalledWith('v_produits_par_zone');
  expect(successChain.eq).toHaveBeenCalledWith('zone_id', 'z1');
});

test('list falls back to produits when view missing', async () => {
  fromMock.mockImplementation((table) => table === 'v_produits_par_zone' ? errorChain : successChain);
  const { result } = renderHook(() => useZoneProducts());
  await act(async () => {
    await result.current.list('z1');
  });
  expect(fromMock).toHaveBeenNthCalledWith(1, 'v_produits_par_zone');
  expect(fromMock).toHaveBeenNthCalledWith(2, 'produits');
  expect(successChain.eq).toHaveBeenCalledWith('zone_id', 'z1');
});

test('move calls rpc with mama id', async () => {
  const { result } = renderHook(() => useZoneProducts());
  await act(async () => {
    await result.current.move('a', 'b', false);
  });
  expect(rpcMock).toHaveBeenCalledWith('move_zone_products', {
    p_mama: 'm1',
    p_src_zone: 'a',
    p_dst_zone: 'b',
    p_keep_quantities: false,
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
    p_dst_zone: 'b',
    p_with_quantities: true,
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
    p_dst_zone: 'b',
  });
});
