import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const orderMock = vi.fn(() => Promise.resolve({ data: [{ id: 'm1' }], error: null }));
const ilikeMock = vi.fn(() => ({ order: orderMock }));
const eqMock = vi.fn(() => ({ ilike: ilikeMock, order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, order: orderMock }));
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
  expect(selectMock).toHaveBeenCalledWith('*, fiches:menu_fiches(fiche_id, fiche: fiches(id, nom))');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(orderMock).toHaveBeenCalledWith('date', { ascending: false });
  expect(result.current.menusDuJour).toEqual([{ id: 'm1' }]);
});
