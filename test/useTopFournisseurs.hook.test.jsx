// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const limitMock = vi.fn(() => Promise.resolve({
  data: [
    { fournisseur_id: 'f1', montant: 100, nombre_achats: 2, mama_id: 'm1' },
  ],
  error: null,
}));
const orderMock = vi.fn(() => ({ limit: limitMock }));
const eqTopMock = vi.fn(() => ({ order: orderMock }));
const selectTopMock = vi.fn(() => ({ eq: eqTopMock }));

const inMock = vi.fn(() => Promise.resolve({
  data: [{ id: 'f1', nom: 'F1' }],
  error: null,
}));
const eqSupMock = vi.fn(() => ({ in: inMock }));
const selectSupMock = vi.fn(() => ({ eq: eqSupMock }));

const fromMock = vi.fn((table) => {
  if (table === 'v_top_fournisseurs') {
    return { select: selectTopMock };
  }
  if (table === 'fournisseurs') {
    return { select: selectSupMock };
  }
  return {};
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useTopFournisseurs;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ default: useTopFournisseurs } = await import(
    '@/hooks/gadgets/useTopFournisseurs.js'
  ));
});

test('récupère les top fournisseurs et fusionne les noms', async () => {
  const { result } = renderHook(() => useTopFournisseurs());
  await waitFor(() => {
    expect(result.current.data).toEqual([
      {
        fournisseur_id: 'f1',
        montant: 100,
        nombre_achats: 2,
        mama_id: 'm1',
        nom: 'F1',
      },
    ]);
  });
  expect(fromMock).toHaveBeenCalledWith('v_top_fournisseurs');
  expect(selectTopMock).toHaveBeenCalledWith(
    'fournisseur_id, montant:montant_total, nombre_achats, mama_id'
  );
  expect(eqTopMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(fromMock).toHaveBeenCalledWith('fournisseurs');
  expect(selectSupMock).toHaveBeenCalledWith('id, nom');
  expect(eqSupMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(inMock).toHaveBeenCalledWith('id', ['f1']);
});
