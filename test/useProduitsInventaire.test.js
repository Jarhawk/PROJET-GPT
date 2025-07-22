// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const orderMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const ilikeMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, order: orderMock }));
const eqMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useProduitsInventaire;

beforeEach(async () => {
  ({ useProduitsInventaire } = await import('@/hooks/useProduitsInventaire'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  ilikeMock.mockClear();
  orderMock.mockClear();
});

test('fetchProduits filters by family and search', async () => {
  const { result } = renderHook(() => useProduitsInventaire());
  await act(async () => {
    await result.current.fetchProduits({ famille: 'Viande', search: 'boeuf' });
  });
  expect(fromMock).toHaveBeenCalledWith('v_produits_dernier_prix');
  expect(fromMock).toHaveBeenCalledWith('v_pmp');
  expect(fromMock).toHaveBeenCalledWith('v_stocks');
  expect(selectMock).toHaveBeenCalledWith('id, nom, unite, famille');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(eqMock).toHaveBeenCalledWith('actif', true);
  expect(ilikeMock).toHaveBeenCalledWith('famille', '%Viande%');
  expect(ilikeMock).toHaveBeenCalledWith('nom', '%boeuf%');
  expect(orderMock).toHaveBeenCalledWith('nom', { ascending: true });
});
