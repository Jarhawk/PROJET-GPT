// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  lte: vi.fn(() => query),
  gte: vi.fn(() => query),
  order: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  single: vi.fn(() => query),
  maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'per1' }, error: null })),
  then: vi.fn(),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => {
  const supabase = { from: fromMock };
  return { supabase, default: supabase };
});
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useInventaires;
let insertCount = 0;

beforeEach(async () => {
  insertCount = 0;
  query.insert.mockImplementation(() => {
    insertCount += 1;
    return query;
  });
  query.then.mockImplementation(fn => {
    if (insertCount === 1) {
      return Promise.resolve(fn({ data: { id: 'invNew' }, error: null }));
    }
    return Promise.resolve(fn({ data: [], error: null }));
  });
  ({ useInventaires } = await import('@/hooks/useInventaires'));
  fromMock.mockClear();
  query.select.mockClear();
  query.eq.mockClear();
  query.order.mockClear();
  query.insert.mockClear();
});

test('getInventaires applies filters', async () => {
  const { result } = renderHook(() => useInventaires());
  await act(async () => {
    await result.current.getInventaires({ zoneId: 'z1', periodeId: '2025-01', statut: 'brouillon' });
  });
  expect(fromMock).toHaveBeenCalledWith('inventaires');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('zone_id', 'z1');
  expect(query.eq).toHaveBeenCalledWith('periode_id', '2025-01');
  expect(query.eq).toHaveBeenCalledWith('statut', 'brouillon');
  expect(query.order).toHaveBeenCalled();
});

test('createInventaire inserts lines with quantite_reelle', async () => {
  const { result } = renderHook(() => useInventaires());
  await act(async () => {
    await result.current.createInventaire({
      date: '2025-01-01',
      zone_id: 'z1',
      lignes: [{ produit_id: 'p1', quantite_reelle: 2 }],
    });
  });
  expect(fromMock).toHaveBeenCalledWith('inventaires');
  expect(fromMock).toHaveBeenCalledWith('produits_inventaire');
  // second insert call corresponds to lignes
  expect(query.insert.mock.calls[1][0]).toEqual([
    {
      produit_id: 'p1',
      quantite_reelle: 2,
      inventaire_id: 'invNew',
      mama_id: 'm1',
    },
  ]);
  expect(query.insert.mock.calls[0][0]).toEqual([
    { zone_id: 'z1', date_inventaire: '2025-01-01', periode_id: 'per1', mama_id: 'm1' }
  ]);
});
