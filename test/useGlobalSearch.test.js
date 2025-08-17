// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const prodQuery = {
  ilike: vi.fn(() => prodQuery),
  eq: vi.fn(() => prodQuery),
  select: vi.fn(() => prodQuery),
  limit: vi.fn(() => Promise.resolve({ data: [{ id: 'p1', nom: 'Prod' }], error: null })),
};
const fromMock = vi.fn(() => ({ select: prodQuery.select }));

vi.mock('@/lib/supabaseClient', () => ({ default: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('@/hooks/data/useFournisseurs', () => ({ default: () => ({ data: [{ id: 'f1', nom: 'Four' }] }) }));

let useGlobalSearch;

beforeEach(async () => {
  ({ useGlobalSearch } = await import('@/hooks/useGlobalSearch'));
  fromMock.mockClear();
  prodQuery.select.mockClear();
  prodQuery.ilike.mockClear();
  prodQuery.eq.mockClear();
  prodQuery.limit.mockClear();
});

test('search queries products and filters fournisseurs from hook', async () => {
  const { result } = renderHook(() => useGlobalSearch());
  await act(async () => {
    await result.current.search('boeuf');
  });
  expect(fromMock).toHaveBeenCalledWith('produits');
  expect(fromMock).not.toHaveBeenCalledWith('fournisseurs');
  expect(result.current.results.length).toBe(2);
});
