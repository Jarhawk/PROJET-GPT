// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const limitMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const orderMock = vi.fn(() => ({ limit: limitMock }));
const ilikeMock = vi.fn(() => ({ order: orderMock, limit: limitMock }));
const eqMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, order: orderMock, limit: limitMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, order: orderMock, limit: limitMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useProduitsAutocomplete;

beforeEach(async () => {
  ({ useProduitsAutocomplete } = await import('@/hooks/useProduitsAutocomplete'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  ilikeMock.mockClear();
});

test('searchProduits filters by mama_id and query', async () => {
  const { result } = renderHook(() => useProduitsAutocomplete());
  await act(async () => {
    await result.current.searchProduits('car');
  });
  expect(fromMock).toHaveBeenCalledWith('produits');
  expect(selectMock).toHaveBeenCalledWith('id, nom, unite, tva, dernier_prix, famille:familles(nom)');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(eqMock).toHaveBeenCalledWith('actif', true);
  expect(ilikeMock).toHaveBeenCalledWith('nom', '%car%');
});
