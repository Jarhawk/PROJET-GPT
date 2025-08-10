// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const limitMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const orderMock = vi.fn(() => ({ limit: limitMock }));
const neqMock = vi.fn(() => ({ order: orderMock, limit: limitMock }));
const ilikeMock = vi.fn(() => ({ order: orderMock, limit: limitMock, neq: neqMock }));
const eqMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, neq: neqMock, order: orderMock, limit: limitMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, neq: neqMock, order: orderMock, limit: limitMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useFichesAutocomplete;

beforeEach(async () => {
  ({ useFichesAutocomplete } = await import('@/hooks/useFichesAutocomplete'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  ilikeMock.mockClear();
  neqMock.mockClear();
});

test('searchFiches filters by mama_id and excludeId', async () => {
  const { result } = renderHook(() => useFichesAutocomplete());
  await act(async () => {
    await result.current.searchFiches({ query: 's', excludeId: 'f1' });
  });
  expect(fromMock).toHaveBeenCalledWith('fiches_techniques');
  expect(selectMock).toHaveBeenCalledWith('id, nom, cout_par_portion, actif');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(eqMock).toHaveBeenCalledWith('actif', true);
  expect(ilikeMock).toHaveBeenCalledWith('nom', '%s%');
  expect(neqMock).toHaveBeenCalledWith('id', 'f1');
});
