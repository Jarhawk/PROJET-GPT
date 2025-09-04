import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

let fromMock;
let insertMock;
let query;

function setup(initial = []) {
  query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    then: cb => Promise.resolve(cb({ data: initial, count: initial.length, error: null })),
    insert: vi.fn(rows => {
      insertMock(rows);
      return query;
    }),
  };
  fromMock = vi.fn(() => query);
  vi.mock('@/lib/supabase', () => ({ supabase: { from: (...args) => fromMock(...args) } }), { overwrite: true });
  vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
}

let useProducts;

beforeEach(async () => {
  insertMock = vi.fn(() => query);
  setup([{ id: '1', nom: 'P', famille: 'F', unite: 'kg', pmp: 5 }]);
  ({ useProducts } = await import('@/hooks/useProducts'));
});

test('duplicateProduct omits pmp field', async () => {
  const { result } = renderHook(() => useProducts());
  await act(async () => {
    await result.current.fetchProducts();
  });
  await act(async () => {
    await result.current.duplicateProduct('1', { refresh: false });
  });
  const args = insertMock.mock.calls[0][0][0];
  expect(args.pmp).toBeUndefined();
});
