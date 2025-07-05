import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  gte: vi.fn(() => query),
  lte: vi.fn(() => query),
  order: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  single: vi.fn(() => ({ data: { id: '1' }, error: null })),
  then: fn => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1', user_id: 'u1' }) }));

let useRequisitions;

beforeEach(async () => {
  ({ useRequisitions } = await import('@/hooks/useRequisitions'));
  fromMock.mockClear();
  Object.values(query).forEach(fn => fn.mockClear && fn.mockClear());
});

test('getRequisitions applies filters', async () => {
  const { result } = renderHook(() => useRequisitions());
  await act(async () => {
    await result.current.getRequisitions({
      produit: 'p1',
      zone: 'z1',
      type: 'service',
      debut: '2025-01-01',
      fin: '2025-01-31',
    });
  });
  expect(fromMock).toHaveBeenCalledWith('requisitions');
  expect(query.select).toHaveBeenCalledWith('*', { count: 'exact' });
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('produit_id', 'p1');
  expect(query.eq).toHaveBeenCalledWith('zone_id', 'z1');
  expect(query.eq).toHaveBeenCalledWith('type', 'service');
  expect(query.gte).toHaveBeenCalledWith('date', '2025-01-01');
  expect(query.lte).toHaveBeenCalledWith('date', '2025-01-31');
});

test('createRequisition injects ids', async () => {
  const { result } = renderHook(() => useRequisitions());
  await act(async () => {
    await result.current.createRequisition({ produit_id: 'p1', zone_id: 'z1', quantite: 2 });
  });
  expect(fromMock).toHaveBeenCalledWith('requisitions');
  expect(query.insert).toHaveBeenCalled();
  const inserted = query.insert.mock.calls[0][0][0];
  expect(inserted.mama_id).toBe('m1');
  expect(inserted.auteur_id).toBe('u1');
});

