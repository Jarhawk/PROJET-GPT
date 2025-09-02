// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const fpRows = [{ id: '1', produit_id: 'p1', fournisseur_id: 'f1', prix_achat: 10, actif: true, mama_id: 'm1' }];
const prodRows = [{ id: 'p1', nom: 'P1', unite_id: null, famille_id: null, sous_famille_id: null, mama_id: 'm1' }];

function buildQuery(data) {
  const query = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.in = vi.fn(() => query);
  query.then = (resolve) => Promise.resolve({ data, error: null }).then(resolve);
  return query;
}

const fromMock = vi.fn((table) => buildQuery(table === 'fournisseur_produits' ? fpRows : prodRows));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProduitsFournisseur;
beforeEach(async () => {
  ({ useProduitsFournisseur } = await import('@/hooks/useProduitsFournisseur.js'));
  fromMock.mockClear();
});

test('getProduitsDuFournisseur récupère et met en cache les résultats', async () => {
  const { result } = renderHook(() => useProduitsFournisseur());
  let res1;
  await act(async () => {
    res1 = await result.current.getProduitsDuFournisseur('f1');
  });
  expect(fromMock).toHaveBeenCalledWith('fournisseur_produits');
  expect(fromMock).toHaveBeenCalledWith('produits');
  expect(res1).toEqual([{ ...fpRows[0], produit: prodRows[0] }]);
  let res2;
  await act(async () => {
    res2 = await result.current.getProduitsDuFournisseur('f1');
  });
  expect(fromMock).toHaveBeenCalledTimes(2);
  expect(res2).toEqual([{ ...fpRows[0], produit: prodRows[0] }]);
});
