// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { beforeEach, test, expect, vi } from 'vitest';

const supabase = globalThis.__SUPABASE_TEST_CLIENT__;
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProducts;

beforeEach(async () => {
  ({ useProducts } = await import('@/hooks/useProducts'));
  supabase.from.mockClear();
});

test('fetchProductPrices selects fields with last delivery alias', async () => {
  const { result } = renderHook(() => useProducts());
  await act(async () => {
    await result.current.fetchProductPrices('p1');
  });
  expect(supabase.from).toHaveBeenCalledWith('fournisseur_produits');
  const callIndex = supabase.from.mock.calls.findIndex(([arg]) => arg === 'fournisseur_produits');
  const builder = supabase.from.mock.results[callIndex].value;
  expect(builder.select).toHaveBeenCalledWith('*, fournisseur:fournisseurs!fk_fournisseur_produits_fournisseur_id(id, nom), derniere_livraison:date_livraison');
});
