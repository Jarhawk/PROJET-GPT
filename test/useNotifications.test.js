import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  insert: vi.fn(() => queryObj),
  update: vi.fn(() => queryObj),
  maybeSingle: vi.fn(() => queryObj),
  upsert: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
const rpcMock = vi.fn(() => ({ data: null, error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, rpc: rpcMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1', user_id: 'u1' }) }));

let useNotifications;

beforeEach(async () => {
  ({ default: useNotifications } = await import('@/hooks/useNotifications'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.order.mockClear();
  queryObj.insert.mockClear();
});

test('fetchNotifications queries table with filters', async () => {
  const { result } = renderHook(() => useNotifications());
  await act(async () => { await result.current.fetchNotifications({ type: 'info' }); });
  expect(fromMock).toHaveBeenCalledWith('notifications');
  expect(queryObj.select).toHaveBeenCalled();
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('user_id', 'u1');
  expect(queryObj.eq).toHaveBeenCalledWith('type', 'info');
  expect(queryObj.order).toHaveBeenCalledWith('created_at', { ascending: false });
});

test('createNotification inserts row with mama_id', async () => {
  const { result } = renderHook(() => useNotifications());
  await act(async () => { await result.current.createNotification({ titre: 't', texte: 'x', lien: '' }); });
  expect(queryObj.insert).toHaveBeenCalledWith([
    { mama_id: 'm1', user_id: 'u1', titre: 't', texte: 'x', lien: '', type: 'info' }
  ]);
});
