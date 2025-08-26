// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
};
const fromMock = vi.fn(() => queryObj);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useFournisseursInactifs;

beforeEach(async () => {
  ({ useFournisseursInactifs } = await import('@/hooks/useFournisseursInactifs'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
});

test('fetchInactifs queries view with mama_id', async () => {
  queryObj.then = (fn) => Promise.resolve(fn({ data: [], error: null }));
  const { result } = renderHook(() => useFournisseursInactifs());
  await act(async () => {
    await result.current.fetchInactifs();
  });
  expect(fromMock).toHaveBeenCalledWith('v_fournisseurs_inactifs');
  expect(queryObj.select).toHaveBeenCalledWith(
    'id:fournisseur_id, nom, fournisseur_actif, facture_actif, dernier_achat, mama_id'
  );
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
});
