// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const prodIlike = vi.fn(() => Promise.resolve({ data: [{ id: 'p1', nom: 'Prod' }], error: null }));
const ficheIlike = vi.fn(() =>
  Promise.resolve({ data: [{ id: 'f1', nom: 'Fiche' }], error: null })
);
const prodEq = vi.fn(() => ({ ilike: prodIlike }));
const prodSelect = vi.fn(() => ({ eq: prodEq }));
const ficheEq = vi.fn(() => ({ ilike: ficheIlike }));
const ficheSelect = vi.fn(() => ({ eq: ficheEq }));
const fromMock = vi
  .fn()
  .mockReturnValueOnce({ select: prodSelect })
  .mockReturnValueOnce({ select: ficheSelect });

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useGlobalSearch;

beforeEach(async () => {
  ({ useGlobalSearch } = await import('@/hooks/useGlobalSearch'));
  fromMock.mockClear();
  prodSelect.mockClear();
  ficheSelect.mockClear();
  prodIlike.mockClear();
  ficheIlike.mockClear();
});

test('search queries produits and fiches and returns max two results', async () => {
  const { result } = renderHook(() => useGlobalSearch());
  await act(async () => {
    await result.current.search('boeuf');
  });
  expect(fromMock).toHaveBeenCalledWith('produits');
  expect(fromMock).toHaveBeenCalledWith('fiches_techniques');
  expect(prodSelect).toHaveBeenCalledWith('id, nom');
  expect(prodEq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(ficheSelect).toHaveBeenCalledWith('id, nom');
  expect(ficheEq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(result.current.results).toEqual([
    { type: 'produit', id: 'p1', nom: 'Prod' },
    { type: 'fiche', id: 'f1', nom: 'Fiche' },
  ]);
});
