// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rangeMock = vi.fn(() => Promise.resolve({ data: [], count: 0, error: null }));
const orderMock = vi.fn(() => ({ range: rangeMock }));
const ilikeMock = vi.fn(() => ({ order: orderMock, range: rangeMock }));
const eqMock = vi.fn(() => ({ ilike: ilikeMock, order: orderMock, range: rangeMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, order: orderMock, range: rangeMock }));

const insertLinesMock = vi.fn(() => Promise.resolve({ error: null }));
const singleMock = vi.fn(() => Promise.resolve({ data: { id: 'f1' }, error: null }));
const selectInsertMock = vi.fn(() => ({ single: singleMock }));
const insertMainMock = vi.fn(() => ({ select: selectInsertMock }));

const fromMock = vi.fn((table) => {
  if (table === 'fiches_techniques') {
    return { select: selectMock, insert: insertMainMock, update: vi.fn(), delete: vi.fn() };
  }
  if (table === 'fiche_lignes') {
    return { insert: insertLinesMock };
  }
  return { select: selectMock };
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useFiches;

beforeEach(async () => {
  ({ useFiches } = await import('@/hooks/useFiches'));
  fromMock.mockClear();
  selectMock.mockClear();
  orderMock.mockClear();
  insertMainMock.mockClear();
  insertLinesMock.mockClear();
});

test('getFiches defaults sort field when invalid', async () => {
  const { result } = renderHook(() => useFiches());
  await act(async () => {
    await result.current.getFiches({ sortBy: 'foo' });
  });
  expect(orderMock).toHaveBeenCalledWith('nom', { ascending: true });
});

test('createFiche inserts fiche and lines', async () => {
  const { result } = renderHook(() => useFiches());
  await act(async () => {
    await result.current.createFiche({ nom: 'f', lignes: [{ produit_id: 'p1', quantite: 1 }] });
  });
  expect(insertMainMock).toHaveBeenCalled();
  expect(insertLinesMock).toHaveBeenCalled();
});

test('createFiche updates local state', async () => {
  const { result } = renderHook(() => useFiches());
  await act(async () => {
    await result.current.createFiche({ nom: 'f', lignes: [] });
  });
  expect(result.current.fiches).toHaveLength(1);
  expect(result.current.fiches[0].nom).toBe('f');
});

test('createFiche returns error on failure', async () => {
  insertMainMock.mockImplementationOnce(() => ({
    select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'denied' } }) })
  }));
  const { result } = renderHook(() => useFiches());
  let res;
  await act(async () => {
    res = await result.current.createFiche({ nom: 'x', lignes: [] });
  });
  expect(res.error).toBeTruthy();
});
