// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const limitMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const orderMock = vi.fn(() => ({ limit: limitMock }));
const orMock = vi.fn(() => ({ order: orderMock, limit: limitMock }));
const eqMock = vi.fn(() => ({ or: orMock, order: orderMock, limit: limitMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, or: orMock, order: orderMock, limit: limitMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useFournisseursAutocomplete;

beforeEach(async () => {
  ({ useFournisseursAutocomplete } = await import('@/hooks/useFournisseursAutocomplete'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  orMock.mockClear();
});

test('searchFournisseurs filters by mama_id and query', async () => {
  const { result } = renderHook(() => useFournisseursAutocomplete());
  await act(async () => {
    await result.current.searchFournisseurs('paris');
  });
  expect(fromMock).toHaveBeenCalledWith('fournisseurs');
  expect(selectMock).toHaveBeenCalledWith('id, nom, ville');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(orMock).toHaveBeenCalledWith('nom.ilike.%paris%,ville.ilike.%paris%');
});
