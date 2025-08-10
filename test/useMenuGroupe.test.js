// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const eqMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const orderMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: eqMock, order: orderMock }));
const insertMock = vi.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) }));

const fromMock = vi.fn((table) => {
  if (table === 'menu_groupes') {
    return { select: selectMock };
  }
  if (table === 'menu_groupe_lignes') {
    return { insert: insertMock, delete: vi.fn(), update: vi.fn() };
  }
  if (table === 'v_menu_groupe_resume' || table === 'v_menu_groupe_couts') {
    return { select: selectMock };
  }
  if (table === 'menu_groupe_modeles') {
    return { insert: insertMock };
  }
  if (table === 'menu_groupe_modele_lignes') {
    return { select: selectMock, insert: insertMock };
  }
  return {};
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, functions: { invoke: vi.fn() } } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useMenuGroupe;

beforeEach(async () => {
  ({ useAuth: useMenuGroupe } = await import('@/hooks/useMenuGroupe'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
});

test('fetchMenusGroupes queries table', async () => {
  const { result } = renderHook(() => useMenuGroupe());
  await act(async () => { await result.current.fetchMenusGroupes({ q: 'a' }); });
  expect(fromMock).toHaveBeenCalledWith('menu_groupes');
  expect(selectMock).toHaveBeenCalled();
});

test('addLigne inserts row', async () => {
  const { result } = renderHook(() => useMenuGroupe());
  await act(async () => {
    await result.current.addLigne('mg1', { categorie: 'plat', fiche_id: 'f1', portions_par_personne: 1 });
  });
  expect(fromMock).toHaveBeenCalledWith('menu_groupe_lignes');
  expect(insertMock).toHaveBeenCalled();
});
