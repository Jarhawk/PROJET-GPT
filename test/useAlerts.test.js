import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  insert: vi.fn(() => queryObj),
  update: vi.fn(() => queryObj),
  delete: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useAlerts;

beforeEach(async () => {
  ({ useAlerts } = await import('@/hooks/useAlerts'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.order.mockClear();
  queryObj.eq.mockClear();
  queryObj.insert.mockClear();
});

test('fetchRules queries alert_rules', async () => {
  const { result } = renderHook(() => useAlerts());
  await act(async () => { await result.current.fetchRules(); });
  expect(fromMock).toHaveBeenCalledWith('alert_rules');
  expect(queryObj.select).toHaveBeenCalledWith('*');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.order).toHaveBeenCalledWith('created_at', { ascending: false });
});

test('addRule inserts row with mama_id', async () => {
  const { result } = renderHook(() => useAlerts());
  await act(async () => { await result.current.addRule({ product_id: 'p1', threshold: 2 }); });
  expect(queryObj.insert).toHaveBeenCalledWith([{ product_id: 'p1', threshold: 2, mama_id: 'm1' }]);
});
