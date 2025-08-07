// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, test, expect } from 'vitest';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '@/context/AuthContext';

vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useMenuDuJour;
let upsertMock, updateMock, updateMatchMock, deleteMock, deleteMatchMock, insertMock, selectMock, selectMatchMock;
let fromSpy;
const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ mama_id: 'm1' }}>{children}</AuthContext.Provider>
);

beforeEach(async () => {
  ({ useMenuDuJour } = await import('@/hooks/useMenuDuJour'));
  upsertMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
  updateMatchMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
  updateMock = vi.fn(() => ({ match: updateMatchMock }));
  deleteMatchMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
  deleteMock = vi.fn(() => ({ match: deleteMatchMock }));
  insertMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
  selectMatchMock = vi.fn(() => Promise.resolve({ data: [{ categorie: 'entrée', fiche_id: 'f1', portions: 2 }] }));
  selectMock = vi.fn(() => ({ match: selectMatchMock }));
  fromSpy = vi.spyOn(supabase, 'from').mockImplementation(() => ({
    upsert: upsertMock,
    update: updateMock,
    delete: deleteMock,
    insert: insertMock,
    select: selectMock,
  }));
});

afterEach(() => {
  fromSpy.mockRestore();
});

test('setFicheForCategorie upserts row', async () => {
  const { result } = renderHook(() => useMenuDuJour(), { wrapper });
  await act(async () => {
    await result.current.setFicheForCategorie('2025-01-01', 'entrée', 'f1');
  });
  expect(supabase.from).toHaveBeenCalledWith('menus_jour');
  expect(upsertMock).toHaveBeenCalledWith(
    { mama_id: 'm1', date: '2025-01-01', categorie: 'entrée', fiche_id: 'f1' },
    { onConflict: 'date,categorie,mama_id' }
  );
});

test('setPortions updates quantity', async () => {
  const { result } = renderHook(() => useMenuDuJour(), { wrapper });
  await act(async () => {
    await result.current.setPortions('2025-01-01', 'plat', 5);
  });
  expect(updateMock).toHaveBeenCalledWith({ portions: 5 });
  expect(updateMatchMock).toHaveBeenCalledWith({ mama_id: 'm1', date: '2025-01-01', categorie: 'plat' });
});

test('removeFicheFromMenu deletes row', async () => {
  const { result } = renderHook(() => useMenuDuJour(), { wrapper });
  await act(async () => {
    await result.current.removeFicheFromMenu('2025-01-01', 'dessert');
  });
  expect(deleteMock).toHaveBeenCalled();
  expect(deleteMatchMock).toHaveBeenCalledWith({ mama_id: 'm1', date: '2025-01-01', categorie: 'dessert' });
});

test('duplicateMenu copies records', async () => {
  const { result } = renderHook(() => useMenuDuJour(), { wrapper });
  await act(async () => {
    await result.current.duplicateMenu('2025-01-01', '2025-01-02');
  });
  expect(selectMock).toHaveBeenCalled();
  expect(selectMatchMock).toHaveBeenCalledWith({ mama_id: 'm1', date: '2025-01-01' });
  expect(insertMock).toHaveBeenCalledWith([
    { categorie: 'entrée', fiche_id: 'f1', portions: 2, date: '2025-01-02', mama_id: 'm1' },
  ]);
});
