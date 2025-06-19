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

let useDocuments;

beforeEach(async () => {
  ({ useDocuments } = await import('@/hooks/useDocuments'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.order.mockClear();
  queryObj.eq.mockClear();
  queryObj.insert.mockClear();
});

test('fetchDocs queries documents', async () => {
  const { result } = renderHook(() => useDocuments());
  await act(async () => { await result.current.fetchDocs(); });
  expect(fromMock).toHaveBeenCalledWith('documents');
  expect(queryObj.select).toHaveBeenCalledWith('*');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.order).toHaveBeenCalledWith('created_at', { ascending: false });
});

test('addDoc inserts row with mama_id', async () => {
  const { result } = renderHook(() => useDocuments());
  await act(async () => { await result.current.addDoc({ title: 't', file_url: '/f' }); });
  expect(queryObj.insert).toHaveBeenCalledWith([{ title: 't', file_url: '/f', mama_id: 'm1' }]);
});
