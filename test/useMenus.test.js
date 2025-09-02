// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const sheetToJson = vi.fn(() => [{ nom: 'Menu1' }]);
let readMock = vi.fn(() => ({ SheetNames: ['Menus'], Sheets: { Menus: {} } }));
vi.mock('xlsx', () => ({ read: (...args) => readMock(...args), utils: { sheet_to_json: sheetToJson } }), { virtual: true });

const rangeMock = vi.fn(() => Promise.resolve({ data: [], count: 0, error: null }));
const orderMock = vi.fn(() => ({ range: rangeMock }));
const lteMock = vi.fn(() => ({ order: orderMock }));
const gteMock = vi.fn(() => ({ lte: lteMock, order: orderMock }));
const ilikeMock = vi.fn(() => ({ gte: gteMock, lte: lteMock, order: orderMock }));
const eqMock = vi.fn(() => ({ ilike: ilikeMock, gte: gteMock, lte: lteMock, order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, ilike: ilikeMock, gte: gteMock, lte: lteMock, order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
let channel;
const channelOn = vi.fn(() => channel);
const channelSubscribe = vi.fn(() => channel);
channel = { on: channelOn, subscribe: channelSubscribe };
const channelMock = vi.fn(() => channel);
const removeChannelMock = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock, channel: channelMock, removeChannel: removeChannelMock },
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useMenus;

beforeEach(async () => {
  ({ useMenus } = await import('@/hooks/useMenus'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  sheetToJson.mockClear();
  readMock.mockClear();
  channelOn.mockClear();
  channelSubscribe.mockClear();
  removeChannelMock.mockClear();
});

test('importMenusFromExcel parses rows', async () => {
  const file = { arrayBuffer: vi.fn(async () => new ArrayBuffer(8)) };
  const { result } = renderHook(() => useMenus());
  let rows;
  await act(async () => {
    rows = await result.current.importMenusFromExcel(file);
  });
  expect(file.arrayBuffer).toHaveBeenCalled();
  expect(readMock).toHaveBeenCalled();
  expect(sheetToJson).toHaveBeenCalled();
  expect(rows).toEqual([{ nom: 'Menu1' }]);
});

test('importMenusFromExcel falls back to first sheet', async () => {
  readMock = vi.fn(() => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } }));
  ({ useMenus } = await import('@/hooks/useMenus'));
  const file = { arrayBuffer: vi.fn(async () => new ArrayBuffer(8)) };
  const { result } = renderHook(() => useMenus());
  let rows;
  await act(async () => {
    rows = await result.current.importMenusFromExcel(file);
  });
  expect(readMock).toHaveBeenCalled();
  expect(sheetToJson).toHaveBeenCalled();
  expect(rows).toEqual([{ nom: 'Menu1' }]);
});

test('subscribeToMenus listens for inserts', async () => {
  const { result } = renderHook(() => useMenus());
  const handler = vi.fn();
  const unsub = result.current.subscribeToMenus(handler);
  expect(channelMock).toHaveBeenCalledWith('menus');
  expect(channelOn).toHaveBeenCalled();
  expect(channelSubscribe).toHaveBeenCalled();
  act(() => {
    const cb = channelOn.mock.calls[0][2];
    cb({ new: { id: 'm2' } });
  });
  expect(handler).toHaveBeenCalledWith({ id: 'm2' });
  unsub();
  expect(removeChannelMock).toHaveBeenCalledWith(channel);
});

test('getMenus merges fiche details', async () => {
  const menusRange = vi.fn(() =>
    Promise.resolve({
      data: [
        {
          id: 'm1',
          nom: 'MenuX',
          date: '2025-01-01',
          actif: true,
          fiches: [{ fiche_id: 'f1' }, { fiche_id: 'f2' }],
        },
      ],
      count: 1,
      error: null,
    })
  );
  const menusOrder = vi.fn(() => ({ range: menusRange }));
  const menusEq = vi.fn(() => ({ eq: menusEq, order: menusOrder }));
  const menusSelect = vi.fn(() => ({ eq: menusEq }));

  const ftIn = vi.fn(() =>
    Promise.resolve({
      data: [
        { fiche_id: 'f1', nom: 'F1', cout_par_portion: 10 },
        { fiche_id: 'f2', nom: 'F2', cout_par_portion: 20 },
      ],
      error: null,
    })
  );
  const ftEq = vi.fn(() => ({ in: ftIn }));
  const ftSelect = vi.fn(() => ({ eq: ftEq }));

  fromMock.mockImplementation((table) => {
    if (table === 'menus') return { select: menusSelect };
    if (table === 'fiches_techniques') return { select: ftSelect };
    return { select: selectMock };
  });

  const { result } = renderHook(() => useMenus());
  await act(async () => {
    await result.current.getMenus();
  });
  expect(menusSelect).toHaveBeenCalledWith(
    'id, nom, date, actif, fiches:menu_fiches(fiche_id, mama_id)',
    { count: 'exact' }
  );
  expect(ftSelect).toHaveBeenCalledWith('fiche_id, nom, cout_par_portion');
  expect(result.current.menus).toEqual([
    {
      id: 'm1',
      nom: 'MenuX',
      date: '2025-01-01',
      actif: true,
      fiches: [
        { fiche_id: 'f1', fiche: { nom: 'F1', cout_par_portion: 10 } },
        { fiche_id: 'f2', fiche: { nom: 'F2', cout_par_portion: 20 } },
      ],
    },
  ]);
});
