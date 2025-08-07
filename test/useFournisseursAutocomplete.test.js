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

let useFournisseursAutocomplete;

beforeEach(async () => {
  ({ useFournisseursAutocomplete } = await import('@/hooks/useFournisseursAutocomplete'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  ilikeMock.mockClear();
});

test('searchFournisseurs filters by mama_id and query', async () => {
  const { result } = renderHook(() => useFournisseursAutocomplete());
  await act(async () => {
    await result.current.searchFournisseurs('paris');
  });
  expect(fromMock).toHaveBeenCalledWith('fournisseurs');
  expect(selectMock).toHaveBeenCalledWith('id, nom');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(ilikeMock).toHaveBeenCalledWith('nom', '%paris%');
});
