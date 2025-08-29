// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  order: vi.fn(() => query),
  eq: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({}) }));

let useHelpArticles;

beforeEach(async () => {
  ({ useHelpArticles } = await import('@/hooks/useHelpArticles'));
  fromMock.mockClear();
  query.select.mockClear();
  query.order.mockClear();
  query.eq.mockClear();
  query.insert.mockClear();
});

test('fetchArticles queries table', async () => {
  const { result } = renderHook(() => useHelpArticles());
  await act(async () => { await result.current.fetchArticles(); });
  expect(fromMock).toHaveBeenCalledWith('help_articles');
  expect(query.select).toHaveBeenCalledWith('id, titre, contenu, created_at');
  expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
});

test('addArticle inserts article', async () => {
  const { result } = renderHook(() => useHelpArticles());
  await act(async () => { await result.current.addArticle({ titre: 't', contenu: 'c' }); });
  expect(query.insert).toHaveBeenCalledWith([{ titre: 't', contenu: 'c' }]);
});

test('updateArticle sends update query', async () => {
  const { result } = renderHook(() => useHelpArticles());
  await act(async () => { await result.current.updateArticle('id1', { titre: 'u' }); });
  expect(query.update).toHaveBeenCalledWith({ titre: 'u' });
  expect(query.eq).toHaveBeenCalledWith('id', 'id1');
});

test('deleteArticle removes row', async () => {
  const { result } = renderHook(() => useHelpArticles());
  await act(async () => { await result.current.deleteArticle('id2'); });
  expect(query.delete).toHaveBeenCalled();
  expect(query.eq).toHaveBeenCalledWith('id', 'id2');
});
