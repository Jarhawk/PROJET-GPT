import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const prodQuery = { ilike: vi.fn(() => prodQuery), eq: vi.fn(() => prodQuery), select: vi.fn(() => prodQuery), limit: vi.fn(() => Promise.resolve({ data: [{ id: 'p1', nom: 'Prod' }], error: null })) };
const fourQuery = { ilike: vi.fn(() => fourQuery), eq: vi.fn(() => fourQuery), select: vi.fn(() => fourQuery), limit: vi.fn(() => Promise.resolve({ data: [{ id: 'f1', nom: 'Four' }], error: null })) };
const fromMock = vi.fn(source => ({ select: source === 'products' ? prodQuery.select : fourQuery.select }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useGlobalSearch;

beforeEach(async () => {
  ({ useGlobalSearch } = await import('@/hooks/useGlobalSearch'));
  fromMock.mockClear();
  prodQuery.select.mockClear();
  prodQuery.ilike.mockClear();
  prodQuery.eq.mockClear();
  prodQuery.limit.mockClear();
  fourQuery.select.mockClear();
  fourQuery.ilike.mockClear();
  fourQuery.eq.mockClear();
  fourQuery.limit.mockClear();
});

test('search queries products and fournisseurs', async () => {
  const { result } = renderHook(() => useGlobalSearch());
  await act(async () => { await result.current.search('boeuf'); });
  expect(fromMock).toHaveBeenCalledWith('products');
  expect(fromMock).toHaveBeenCalledWith('fournisseurs');
  expect(result.current.results.length).toBe(2);
});
