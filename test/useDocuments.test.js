import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  ilike: vi.fn(() => queryObj),
  insert: vi.fn(() => queryObj),
  delete: vi.fn(() => queryObj),
  single: vi.fn(() => Promise.resolve({ data: { url: '/f' }, error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('@/hooks/useStorage', () => ({
  uploadFile: vi.fn(() => '/f'),
  deleteFile: vi.fn(),
  pathFromUrl: vi.fn(() => 'p'),
}));

let useDocuments;

beforeEach(async () => {
  ({ useDocuments } = await import('@/hooks/useDocuments'));
  fromMock.mockClear();
  Object.values(queryObj).forEach(fn => fn.mockClear && fn.mockClear());
});

test('listDocuments queries documents with search', async () => {
  queryObj.then = (fn) => Promise.resolve(fn({ data: [], error: null }));
  const { result } = renderHook(() => useDocuments());
  await act(async () => { await result.current.listDocuments({ search: 'foo' }); });
  expect(fromMock).toHaveBeenCalledWith('documents');
  expect(queryObj.select).toHaveBeenCalledWith('*');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.ilike).toHaveBeenCalledWith('nom', '%foo%');
});

test('uploadDocument inserts row with metadata', async () => {
  queryObj.select.mockReturnValue(queryObj);
  queryObj.single.mockReturnValue(Promise.resolve({ data: { id: '1' }, error: null }));
  const { result } = renderHook(() => useDocuments());
  const file = new File(['a'], 'file.txt', { type: 'text/plain' });
  await act(async () => { await result.current.uploadDocument(file, { categorie: 'c' }); });
  expect(queryObj.insert).toHaveBeenCalled();
});
