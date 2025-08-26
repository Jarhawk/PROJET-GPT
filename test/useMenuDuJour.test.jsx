// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, test, expect } from 'vitest';
import { supabase } from '@/lib/supabase';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useMenuDuJour;
let upsertMock, insertMock, deleteMock, deleteQuery, fromSpy;

beforeEach(async () => {
  ({ useMenuDuJour } = await import('@/hooks/useMenuDuJour'));

  const selectSingle = vi.fn(() => Promise.resolve({ data: { id: 'menu1' }, error: null }));
  const select = vi.fn(() => ({ single: selectSingle }));
  upsertMock = vi.fn(() => ({ select }));

  insertMock = vi.fn(() => Promise.resolve({ error: null }));

  deleteQuery = {
    eq: vi.fn()
  };
  deleteQuery.eq
    .mockReturnValueOnce(deleteQuery)
    .mockReturnValueOnce(Promise.resolve({ error: null }));
  deleteMock = vi.fn(() => deleteQuery);

  fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table) => {
    if (table === 'menus_jour') return { upsert: upsertMock };
    if (table === 'menus_jour_fiches') return { delete: deleteMock, insert: insertMock };
    return {};
  });
});

afterEach(() => {
  fromSpy.mockRestore();
});

test('createOrUpdateMenu upserts menu and inserts lines', async () => {
  const { result } = renderHook(() => useMenuDuJour());
  await act(async () => {
    await result.current.createOrUpdateMenu('2025-01-01', [
      { fiche_id: 'f1', portions: 2 },
    ]);
  });

  expect(fromSpy).toHaveBeenCalledWith('menus_jour');
  expect(upsertMock).toHaveBeenCalledWith(
    { mama_id: 'm1', date: '2025-01-01' },
    { onConflict: 'mama_id,date' }
  );
  expect(fromSpy).toHaveBeenCalledWith('menus_jour_fiches');
  expect(deleteMock).toHaveBeenCalled();
  expect(deleteQuery.eq).toHaveBeenNthCalledWith(1, 'menu_jour_id', 'menu1');
  expect(deleteQuery.eq).toHaveBeenNthCalledWith(2, 'mama_id', 'm1');
  expect(insertMock).toHaveBeenCalledWith([
    { menu_jour_id: 'menu1', fiche_id: 'f1', quantite: 2, mama_id: 'm1' },
  ]);
});

