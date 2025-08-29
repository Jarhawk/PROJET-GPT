// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  ilike: vi.fn(() => queryObj),
  insert: vi.fn(() => queryObj),
  delete: vi.fn(() => queryObj),
  single: vi.fn(() => Promise.resolve({ data: { chemin: '/f' }, error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
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
  expect(queryObj.select).toHaveBeenCalledWith('id, chemin, type, mama_id, created_at');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.ilike).toHaveBeenCalledWith('chemin', '%foo%');
});

test('uploadDocument inserts row', async () => {
  queryObj.select.mockReturnValue(queryObj);
  queryObj.single.mockReturnValue(Promise.resolve({ data: { id: '1', chemin: '/f', type: 'text/plain', mama_id: 'm1' }, error: null }));
  const { result } = renderHook(() => useDocuments());
  const file = new File(['a'], 'file.txt', { type: 'text/plain' });
  await act(async () => { await result.current.uploadDocument(file); });
  expect(queryObj.insert).toHaveBeenCalled();
});
