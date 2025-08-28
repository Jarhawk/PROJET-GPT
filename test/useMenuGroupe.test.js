// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const eqMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const orderMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: eqMock, order: orderMock }));
const insertMock = vi.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) }));

const fromMock = vi.fn((table) => {
  if (table === 'menus') {
    return { select: selectMock };
  }
  if (table === 'menu_fiches') {
    return { insert: insertMock };
  }
  return {};
});

const supabaseMock = { from: fromMock, functions: { invoke: vi.fn() } };
vi.mock('@/lib/supabase', () => ({ __esModule: true, default: supabaseMock, supabase: supabaseMock }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useMenuGroupe;

beforeEach(async () => {
  useMenuGroupe = (await import('@/hooks/useMenuGroupe')).default;
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
});

test('fetchMenusGroupes queries table', async () => {
  const { result } = renderHook(() => useMenuGroupe());
  await act(async () => { await result.current.fetchMenusGroupes({ q: 'a' }); });
  expect(fromMock).toHaveBeenCalledWith('menus');
  expect(selectMock).toHaveBeenCalled();
});

test('addLigne inserts row', async () => {
  const { result } = renderHook(() => useMenuGroupe());
  await act(async () => {
    await result.current.addLigne('mg1', { categorie: 'plat', fiche_id: 'f1', portions_par_personne: 1 });
  });
  expect(fromMock).toHaveBeenCalledWith('menu_fiches');
  expect(insertMock).toHaveBeenCalledWith([{ fiche_id: 'f1', menu_id: 'mg1', mama_id: 'm1' }]);
});
