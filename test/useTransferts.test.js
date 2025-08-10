import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const baseQuery = {
  select: vi.fn(() => baseQuery),
  eq: vi.fn(() => baseQuery),
  gte: vi.fn(() => baseQuery),
  lte: vi.fn(() => baseQuery),
  order: vi.fn(() => baseQuery),
  single: vi.fn(() => ({ data: {}, error: null })),
};

const queryTransferts = {
  ...baseQuery,
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => ({ data: { id: 't1' }, error: null })),
    })),
  })),
};

const queryLignes = {
  ...baseQuery,
  insert: vi.fn(() => ({ data: [], error: null })),
};

const fromMock = vi.fn((table) => {
  if (table === 'transferts') return queryTransferts;
  if (table === 'transfert_lignes') return queryLignes;
  return baseQuery;
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1', user_id: 'u1' }) }));
vi.mock('@/hooks/usePeriodes', () => ({ useAuth: () => ({ checkCurrentPeriode: vi.fn(() => ({})) }) }));

let useTransferts;

beforeEach(async () => {
  ({ useTransferts } = await import('@/hooks/useTransferts'));
  fromMock.mockClear();
  [queryTransferts, queryLignes, baseQuery].forEach((q) => {
    Object.values(q).forEach((fn) => fn.mockClear && fn.mockClear());
  });
});

test('fetchTransferts applies filters', async () => {
  const { result } = renderHook(() => useTransferts());
  await act(async () => {
    await result.current.fetchTransferts({
      debut: '2025-01-01',
      fin: '2025-01-31',
      zone_source_id: 'zs',
      zone_destination_id: 'zd',
      produit_id: 'p1',
    });
  });
  expect(fromMock).toHaveBeenCalledWith('transferts');
  expect(queryTransferts.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryTransferts.eq).toHaveBeenCalledWith('zone_source_id', 'zs');
  expect(queryTransferts.eq).toHaveBeenCalledWith('zone_dest_id', 'zd');
  expect(queryTransferts.eq).toHaveBeenCalledWith('transfert_lignes.produit_id', 'p1');
  expect(queryTransferts.gte).toHaveBeenCalledWith('date_transfert', '2025-01-01');
  expect(queryTransferts.lte).toHaveBeenCalledWith('date_transfert', '2025-01-31');
});

test('createTransfert inserts header and lines', async () => {
  const { result } = renderHook(() => useTransferts());
  await act(async () => {
    await result.current.createTransfert(
      { zone_source_id: 'zs', zone_destination_id: 'zd', motif: 'test' },
      [{ produit_id: 'p1', quantite: 2 }]
    );
  });
  expect(fromMock).toHaveBeenNthCalledWith(1, 'transferts');
  expect(fromMock).toHaveBeenNthCalledWith(2, 'transfert_lignes');
  const insertedHeader = queryTransferts.insert.mock.calls[0][0][0];
  expect(insertedHeader).toMatchObject({
    mama_id: 'm1',
    zone_source_id: 'zs',
    zone_dest_id: 'zd',
    motif: 'test',
    utilisateur_id: 'u1',
  });
  const insertedLine = queryLignes.insert.mock.calls[0][0][0];
  expect(insertedLine).toMatchObject({
    mama_id: 'm1',
    produit_id: 'p1',
    quantite: 2,
    transfert_id: 't1',
  });
});

test('getTransfertById fetches detail', async () => {
  const { result } = renderHook(() => useTransferts());
  await act(async () => {
    await result.current.getTransfertById('t1');
  });
  expect(fromMock).toHaveBeenCalledWith('transferts');
  expect(queryTransferts.eq).toHaveBeenCalledWith('id', 't1');
});

