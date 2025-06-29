// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const selectMock = vi.fn(() => ({
  eq: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })) }))
}));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProducts;

beforeEach(async () => {
  ({ useProducts } = await import('@/hooks/useProducts'));
  fromMock.mockClear();
  selectMock.mockClear();
});

test('fetchProductPrices selects fields with last delivery alias', async () => {
  const { result } = renderHook(() => useProducts());
  await act(async () => {
    await result.current.fetchProductPrices('p1');
  });
  expect(fromMock).toHaveBeenCalledWith('fournisseur_produits');
  expect(selectMock).toHaveBeenCalledWith('*, fournisseur: fournisseurs(id, nom), derniere_livraison:date_livraison');
});
