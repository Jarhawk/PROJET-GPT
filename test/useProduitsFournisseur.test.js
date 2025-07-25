// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const final = { data: [{ id: '1' }], error: null };
const eq2Mock = vi.fn(() => Promise.resolve(final));
const eq1Mock = vi.fn(() => ({ eq: eq2Mock }));
const selectMock = vi.fn(() => ({ eq: eq1Mock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useProduitsFournisseur; // ✅ Correction Codex
beforeEach(async () => {
  ({ useProduitsFournisseur } = await import('@/hooks/useProduitsFournisseur.js'));
  fromMock.mockClear();
  selectMock.mockClear();
  eq1Mock.mockClear();
  eq2Mock.mockClear();
});

test('getProduitsDuFournisseur récupère et met en cache les résultats', async () => { // ✅ Correction Codex
  const { result } = renderHook(() => useProduitsFournisseur()); // ✅ Correction Codex
  let res1;
  await act(async () => {
    res1 = await result.current.getProduitsDuFournisseur('f1'); // ✅ Correction Codex
  });
  expect(fromMock).toHaveBeenCalledWith('fournisseur_produits');
  expect(selectMock).toHaveBeenCalled();
  expect(eq1Mock).toHaveBeenCalledWith('fournisseur_id', 'f1');
  expect(eq2Mock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(res1).toEqual(final.data);
  let res2;
  await act(async () => {
    res2 = await result.current.getProduitsDuFournisseur('f1'); // ✅ Correction Codex
  });
  expect(fromMock).toHaveBeenCalledTimes(1);
  expect(res2).toEqual(final.data);
});
