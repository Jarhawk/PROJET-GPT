// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const eqMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const singleMock = vi.fn(() => Promise.resolve({ data: { id: 'm1' }, error: null }));
const selectAfterInsertMock = vi.fn(() => ({ single: singleMock }));
const insertMenuMock = vi.fn(() => ({ select: selectAfterInsertMock }));
const insertLienMock = vi.fn(() => Promise.resolve({ data: null }));

const fromMock = vi.fn((table) => {
  if (table === 'menus_groupes') {
    return { select: selectMock, insert: insertMenuMock };
  }
  if (table === 'menus_groupes_fiches') {
    return { insert: insertLienMock };
  }
  return {};
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useMenusGroupes;

beforeEach(async () => {
  ({ useMenusGroupes } = await import('@/hooks/useMenusGroupes'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  insertMenuMock.mockClear();
  insertLienMock.mockClear();
});

test('fetchMenusGroupes queries supabase', async () => {
  const { result } = renderHook(() => useMenusGroupes());
  await act(async () => { await result.current.fetchMenusGroupes(); });
  expect(fromMock).toHaveBeenCalledWith('menus_groupes');
  expect(selectMock).toHaveBeenCalled();
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
});

test('createOrUpdateMenu inserts data and liens', async () => {
  const { result } = renderHook(() => useMenusGroupes());
  await act(async () => {
    await result.current.createOrUpdateMenu({ nom: 'Formule', prix_vente: 10, fiches: [{ fiche_id: 'f1', categorie: 'Plat' }] });
  });
  expect(fromMock).toHaveBeenCalledWith('menus_groupes');
  expect(insertMenuMock).toHaveBeenCalled();
  expect(fromMock).toHaveBeenCalledWith('menus_groupes_fiches');
  expect(insertLienMock).toHaveBeenCalled();
});

test('calculateMenuStats returns totals', () => {
  const { result } = renderHook(() => useMenusGroupes());
  const stats = result.current.calculateMenuStats({ prix_vente: 100, fiches: [{ cout: 40 }, { cout: 10 }] });
  expect(stats.totalCost).toBe(50);
  expect(stats.marge).toBe(50);
  expect(Math.round(stats.taux_food_cost)).toBe(50);
});
