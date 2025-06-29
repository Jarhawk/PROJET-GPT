// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const final = { data: [{ id: '1' }], error: null };
const eq2Mock = vi.fn(() => Promise.resolve(final));
const eq1Mock = vi.fn(() => ({ eq: eq2Mock }));
const selectMock = vi.fn(() => ({ eq: eq1Mock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useSupplierProducts;
beforeEach(async () => {
  ({ useSupplierProducts } = await import('@/hooks/useSupplierProducts'));
  fromMock.mockClear();
  selectMock.mockClear();
  eq1Mock.mockClear();
  eq2Mock.mockClear();
});

test('getProductsBySupplier fetches and caches results', async () => {
  const { result } = renderHook(() => useSupplierProducts());
  let res1;
  await act(async () => {
    res1 = await result.current.getProductsBySupplier('f1');
  });
  expect(fromMock).toHaveBeenCalledWith('fournisseur_produits');
  expect(selectMock).toHaveBeenCalled();
  expect(eq1Mock).toHaveBeenCalledWith('fournisseur_id', 'f1');
  expect(eq2Mock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(res1).toEqual(final.data);
  let res2;
  await act(async () => {
    res2 = await result.current.getProductsBySupplier('f1');
  });
  expect(fromMock).toHaveBeenCalledTimes(1);
  expect(res2).toEqual(final.data);
});
