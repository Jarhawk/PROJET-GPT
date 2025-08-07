// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  order: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  single: vi.fn(() => query),
  maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'inv1' }, error: null })),
  then: vi.fn(),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));
vi.mock('@/hooks/usePeriodes', () => ({ default: () => ({ checkCurrentPeriode: vi.fn(() => ({ error: null })) }) }));

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
    await result.current.getInventaires({ zoneId: 'z1', periode: '2025-01', statut: 'brouillon' });
  });
  expect(fromMock).toHaveBeenCalledWith('inventaires');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('zone_id', 'z1');
  expect(query.eq).toHaveBeenCalledWith('periode', '2025-01');
  expect(query.eq).toHaveBeenCalledWith('statut', 'brouillon');
  expect(query.order).toHaveBeenCalled();
});

test('createInventaire inserts lines with quantite_reelle', async () => {
  const { result } = renderHook(() => useInventaires());
  await act(async () => {
    await result.current.createInventaire({
      date: '2025-01-01',
      zone: 'z1',
      lignes: [{ produit_id: 'p1', quantite_reelle: 2 }],
    });
  });
  expect(fromMock).toHaveBeenCalledWith('inventaires');
  expect(fromMock).toHaveBeenCalledWith('inventaire_lignes');
  // second insert call corresponds to lignes
  expect(query.insert.mock.calls[1][0]).toEqual([
    {
      produit_id: 'p1',
      quantite_reelle: 2,
      inventaire_id: 'invNew',
      mama_id: 'm1',
    },
  ]);
});
