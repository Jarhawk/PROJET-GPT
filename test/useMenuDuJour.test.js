import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rangeMock = vi.fn(() => Promise.resolve({ data: [{ id: 'm1' }], count: 1, error: null }));
const orderMock = vi.fn(() => ({ range: rangeMock }));
const lteMock = vi.fn(() => ({ order: orderMock }));
const gteMock = vi.fn(() => ({ lte: lteMock, order: orderMock }));
const ilikeMock = vi.fn(() => ({ gte: gteMock, lte: lteMock, order: orderMock }));
const eqMock = vi.fn(() => ({ ilike: ilikeMock, gte: gteMock, lte: lteMock, order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, gte: gteMock, lte: lteMock, order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useMenuDuJour;

beforeEach(async () => {
  ({ useMenuDuJour } = await import('@/hooks/useMenuDuJour'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  ilikeMock.mockClear();
  orderMock.mockClear();
});

test('fetchMenusDuJour retrieves menus', async () => {
  const { result } = renderHook(() => useMenuDuJour());
  await act(async () => {
    await result.current.fetchMenusDuJour();
  });
  expect(fromMock).toHaveBeenCalledWith('menus');
  expect(selectMock).toHaveBeenCalledWith('*, fiches:menu_fiches(fiche_id, fiche: fiches(id, nom))', { count: 'exact' });
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(orderMock).toHaveBeenCalledWith('date', { ascending: false });
  expect(rangeMock).toHaveBeenCalledWith(0, 49);
  expect(result.current.menusDuJour).toEqual([{ id: 'm1' }]);
});
