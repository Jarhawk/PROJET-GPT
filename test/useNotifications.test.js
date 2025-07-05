// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  insert: vi.fn(() => queryObj),
  update: vi.fn(() => queryObj),
  delete: vi.fn(() => queryObj),
  maybeSingle: vi.fn(() => queryObj),
  single: vi.fn(() => ({ data: { id: 'n1', texte: 'x' }, error: null })),
  upsert: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
const rpcMock = vi.fn(() => ({ data: null, error: null }));
let channel;
const channelOn = vi.fn(() => channel);
const channelSubscribe = vi.fn(() => channel);
channel = { on: channelOn, subscribe: channelSubscribe };
const channelMock = vi.fn(() => channel);
const removeChannelMock = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock, rpc: rpcMock, channel: channelMock, removeChannel: removeChannelMock },
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1', user_id: 'u1' }) }));

let useNotifications;

beforeEach(async () => {
  ({ default: useNotifications } = await import('@/hooks/useNotifications'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.order.mockClear();
  queryObj.insert.mockClear();
  queryObj.update.mockClear();
  queryObj.delete.mockClear();
  channelOn.mockClear();
  channelSubscribe.mockClear();
  removeChannelMock.mockClear();
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

test('markAllAsRead updates unread rows', async () => {
  const { result } = renderHook(() => useNotifications());
  await act(async () => { await result.current.markAllAsRead(); });
  expect(fromMock).toHaveBeenCalledWith('notifications');
  expect(queryObj.update).toHaveBeenCalledWith({ lu: true });
  expect(queryObj.eq).toHaveBeenCalledWith('lu', false);
});

test('fetchUnreadCount returns count', async () => {
  const countObj = {
    select: vi.fn(() => countObj),
    eq: vi.fn(() => countObj),
    count: 5,
  };
  fromMock.mockReturnValueOnce(countObj);
  const { result } = renderHook(() => useNotifications());
  const count = await result.current.fetchUnreadCount();
  expect(count).toBe(5);
});

test('deleteNotification removes row', async () => {
  const { result } = renderHook(() => useNotifications());
  await act(async () => { await result.current.deleteNotification('n1'); });
  expect(fromMock).toHaveBeenCalledWith('notifications');
  expect(queryObj.delete).toHaveBeenCalled();
  expect(queryObj.eq).toHaveBeenCalledWith('id', 'n1');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('user_id', 'u1');
});

test('updateNotification updates row and local state', async () => {
  const { result } = renderHook(() => useNotifications());
  await act(async () => {
    await result.current.updateNotification('n1', { texte: 'x' });
  });
  expect(fromMock).toHaveBeenCalledWith('notifications');
  expect(queryObj.update).toHaveBeenCalledWith({ texte: 'x' });
  expect(queryObj.eq).toHaveBeenCalledWith('id', 'n1');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('user_id', 'u1');
});

test('getNotification fetches single row and updates state', async () => {
  const { result } = renderHook(() => useNotifications());
  await act(async () => {
    await result.current.getNotification('n1');
  });
  expect(fromMock).toHaveBeenCalledWith('notifications');
  expect(queryObj.select).toHaveBeenCalled();
  expect(queryObj.eq).toHaveBeenCalledWith('id', 'n1');
  expect(result.current.items[0].id).toBe('n1');
});

test('subscribeToNotifications listens for inserts', async () => {
  const { result } = renderHook(() => useNotifications());
  const handler = vi.fn();
  const unsub = result.current.subscribeToNotifications(handler);
  expect(channelMock).toHaveBeenCalledWith('notifications');
  expect(channelOn).toHaveBeenCalled();
  expect(channelSubscribe).toHaveBeenCalled();
  act(() => {
    const cb = channelOn.mock.calls[0][2];
    cb({ new: { id: 'n2' } });
  });
  expect(handler).toHaveBeenCalledWith({ id: 'n2' });
  unsub();
  expect(removeChannelMock).toHaveBeenCalledWith(channel);
});
