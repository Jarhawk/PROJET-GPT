// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const limitMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const orderMock = vi.fn(() => ({ limit: limitMock }));
const ilikeMock = vi.fn(() => ({ order: orderMock, limit: limitMock }));
const eqMock = vi.fn(() => ({ ilike: ilikeMock, order: orderMock, limit: limitMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, order: orderMock, limit: limitMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useFacturesAutocomplete;

beforeEach(async () => {
  ({ useFacturesAutocomplete } = await import('@/hooks/useFacturesAutocomplete'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  ilikeMock.mockClear();
});

test('searchFactures filters by mama_id and query', async () => {
  const { result } = renderHook(() => useFacturesAutocomplete());
  await act(async () => {
    await result.current.searchFactures('FA');
  });
  expect(fromMock).toHaveBeenCalledWith('factures');
  expect(selectMock).toHaveBeenCalledWith('id, numero, date_facture, fournisseurs(nom)');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(ilikeMock).toHaveBeenCalledWith('numero', '%FA%');
});
