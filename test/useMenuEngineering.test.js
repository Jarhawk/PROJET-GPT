// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const metricsRows = [{ fiche_id: 'f1', categorie_me: 'Star' }];
const stagedRows = [
  {
    id: 's1',
    fiche_id: 'f1',
    date_vente: '2025-06-01',
    quantite: 2,
    prix_vente_unitaire: 10,
  },
];

const metricsQuery = {
  select: vi.fn(() => metricsQuery),
  eq: vi.fn(() => metricsQuery),
  gte: vi.fn(() => metricsQuery),
  lte: vi.fn(() => metricsQuery),
  then: (fn) => Promise.resolve(fn({ data: metricsRows, error: null })),
};

const stagingQuery = {
  select: vi.fn(() => stagingQuery),
  eq: vi.fn(() => stagingQuery),
  in: vi.fn(() => stagingQuery),
  update: vi.fn(() => stagingQuery),
  then: (fn) => Promise.resolve(fn({ data: stagedRows, error: null })),
};

const ventesQuery = {
  insert: vi.fn(() => Promise.resolve({ error: null })),
  upsert: vi.fn(() => Promise.resolve({ error: null })),
};

const menuQuery = {
  select: vi.fn(() => menuQuery),
  eq: vi.fn(() => menuQuery),
  maybeSingle: vi.fn(() => Promise.resolve({ data: { food_cost_avg: 42 }, error: null })),
};

const fromMock = vi.fn((table) => {
  if (table === 'v_me_classification') return metricsQuery;
  if (table === 'ventes_import_staging') return stagingQuery;
  if (table === 'ventes_fiches') return ventesQuery;
  if (table === 'v_menu_du_jour_mensuel') return menuQuery;
  return {};
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
const authMock = vi.fn(() => ({ mama_id: 'm1' }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: authMock }));

let useMenuEngineering;

beforeEach(async () => {
  ({ useMenuEngineering } = await import('@/hooks/useMenuEngineering'));
  fromMock.mockClear();
  metricsQuery.select.mockClear();
  metricsQuery.eq.mockClear();
  metricsQuery.gte.mockClear();
  metricsQuery.lte.mockClear();
  stagingQuery.select.mockClear();
  stagingQuery.eq.mockClear();
  stagingQuery.in.mockClear();
  stagingQuery.update.mockClear();
  ventesQuery.insert.mockClear();
  ventesQuery.upsert.mockClear();
  menuQuery.select.mockClear();
  menuQuery.eq.mockClear();
  menuQuery.maybeSingle.mockClear();
});

test('fetchMetrics queries classification view and food cost', async () => {
  const { result } = renderHook(() => useMenuEngineering());
  let res;
  await act(async () => {
    res = await result.current.fetchMetrics({
      dateStart: '2025-06-01',
      dateEnd: '2025-06-30',
      type: 'plat',
      actif: true,
    });
  });
  expect(fromMock).toHaveBeenCalledWith('v_me_classification');
  expect(metricsQuery.select).toHaveBeenCalledWith('*');
  expect(metricsQuery.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(menuQuery.select).toHaveBeenCalledWith('food_cost_avg');
  expect(res.rows).toEqual(metricsRows);
  expect(res.foodCost).toBe(42);
});

test('commitImport moves staged rows', async () => {
  const { result } = renderHook(() => useMenuEngineering());
  await act(async () => {
    await result.current.commitImport();
  });
  expect(fromMock).toHaveBeenCalledWith('ventes_import_staging');
  expect(stagingQuery.select).toHaveBeenCalled();
  expect(ventesQuery.insert).toHaveBeenCalledWith([
    {
      mama_id: 'm1',
      fiche_id: 'f1',
      date_vente: '2025-06-01',
      quantite: 2,
      prix_vente_unitaire: 10,
    },
  ]);
  expect(stagingQuery.update).toHaveBeenCalled();
});

test('upsertManual writes sale', async () => {
  const { result } = renderHook(() => useMenuEngineering());
  await act(async () => {
    await result.current.upsertManual({
      fiche_id: 'f1',
      date_vente: '2025-06-01',
      quantite: 3,
      prix_vente_unitaire: 9,
    });
  });
  expect(fromMock).toHaveBeenCalledWith('ventes_fiches');
  expect(ventesQuery.upsert).toHaveBeenCalledWith(
    [
      {
        mama_id: 'm1',
        fiche_id: 'f1',
        date_vente: '2025-06-01',
        quantite: 3,
        prix_vente_unitaire: 9,
      },
    ],
    { onConflict: 'mama_id,fiche_id,date_vente' }
  );
});

test('fetchMetrics skips when no mama_id', async () => {
  authMock.mockReturnValueOnce({ mama_id: null });
  ({ useMenuEngineering } = await import('@/hooks/useMenuEngineering'));
  const { result } = renderHook(() => useMenuEngineering());
  let res;
  await act(async () => {
    res = await result.current.fetchMetrics({});
  });
  expect(res.rows).toEqual([]);
  expect(fromMock).not.toHaveBeenCalled();
});

