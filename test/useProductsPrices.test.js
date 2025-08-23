// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import { makeSupabaseMock } from './mocks/supabaseClient.js';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProducts;
let client;

beforeEach(async () => {
  globalThis.__SUPABASE_TEST_CLIENT__ = makeSupabaseMock({ data: [], error: null });
  client = globalThis.__SUPABASE_TEST_CLIENT__;
  ({ useProducts } = await import('@/hooks/useProducts'));
  vi.clearAllMocks();
});

test('fetchProductPrices selects fields with last delivery alias', async () => {
  const { result } = renderHook(() => useProducts());
  await act(async () => {
    await result.current.fetchProductPrices('p1');
  });
  expect(client.from).toHaveBeenCalledWith('fournisseur_produits');
  const query = client.from.mock.results[0].value;
  expect(query.select).toHaveBeenCalledWith('*, fournisseur:fournisseurs!fk_fournisseur_produits_fournisseur_id(id, nom), derniere_livraison:date_livraison');
});
