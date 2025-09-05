// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const prodOr = vi.fn(() => Promise.resolve({ data: [{ id: 'p1', nom: 'Prod' }], error: null }));
const prodEq = vi.fn(() => ({ or: prodOr }));
const prodSelect = vi.fn(() => ({ eq: prodEq }));
const ficheIlike = vi.fn(() => Promise.resolve({ data: [{ id: 'f1', nom: 'Fiche' }], error: null }));
const ficheEq = vi.fn(() => ({ ilike: ficheIlike }));
const ficheSelect = vi.fn(() => ({ eq: ficheEq }));
const fromMock = vi.fn()
  .mockReturnValueOnce({ select: prodSelect })
  .mockReturnValueOnce({ select: ficheSelect });

vi.mock('@/lib/supabase', () => ({ default: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useGlobalSearch;

beforeEach(async () => {
  ({ useGlobalSearch } = await import('@/hooks/useGlobalSearch'));
  fromMock.mockClear();
  prodSelect.mockClear();
  prodEq.mockClear();
  prodOr.mockClear();
  ficheSelect.mockClear();
  ficheEq.mockClear();
  ficheIlike.mockClear();
});

test('search queries produits and fiches and returns max two results', async () => {
  const { result } = renderHook(() => useGlobalSearch());
  await act(async () => {
    await result.current.search('boeuf');
  });
  expect(fromMock).toHaveBeenCalledWith('produits');
  expect(fromMock).toHaveBeenCalledWith('fiches');
  expect(prodOr).toHaveBeenCalledWith('nom.ilike.%boeuf%,code.ilike.%boeuf%');
  expect(result.current.results).toEqual([
    { type: 'produit', id: 'p1', nom: 'Prod' },
    { type: 'fiche', id: 'f1', nom: 'Fiche' },
  ]);
});
