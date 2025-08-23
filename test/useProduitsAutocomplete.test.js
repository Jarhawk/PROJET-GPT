// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import { makeSupabaseMock } from './mocks/supabaseClient.js';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProduitsAutocomplete;
let client;

beforeEach(async () => {
  globalThis.__SUPABASE_TEST_CLIENT__ = makeSupabaseMock({ data: [], error: null });
  client = globalThis.__SUPABASE_TEST_CLIENT__;
  ({ useProduitsAutocomplete } = await import('@/hooks/useProduitsAutocomplete'));
  vi.clearAllMocks();
});

test('searchProduits filters by mama_id and query', async () => {
  const { result } = renderHook(() => useProduitsAutocomplete());
  await act(async () => {
    await result.current.searchProduits('car');
  });
  expect(client.from).toHaveBeenCalledWith('produits');
  const query = client.from.mock.results[0].value;
  expect(query.select).toHaveBeenCalledWith('id, nom, tva, dernier_prix, unite_id, unite:unite_id (nom)');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('actif', true);
  expect(query.ilike).toHaveBeenCalledWith('nom', '%car%');
});
