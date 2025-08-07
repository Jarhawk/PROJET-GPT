import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  gte: vi.fn(() => query),
  lte: vi.fn(() => query),
  order: vi.fn(() => query),
  range: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  single: vi.fn(() => ({ data: { id: '1' }, error: null })),
  then: fn => Promise.resolve(fn({ data: [], count: 0, error: null })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', user_id: 'u1' }) }));

let useRequisitions;

beforeEach(async () => {
  ({ useRequisitions } = await import('@/hooks/useRequisitions'));
  fromMock.mockClear();
  Object.values(query).forEach(fn => fn.mockClear && fn.mockClear());
});

test('getRequisitions applies filters', async () => {
  const { result } = renderHook(() => useRequisitions());
  await act(async () => {
    await result.current.getRequisitions({
      statut: 'draft',
      utilisateur: 'u2',
      produit: 'p1',
      debut: '2025-01-01',
      fin: '2025-01-31',
      page: 2,
    });
  });
  expect(fromMock).toHaveBeenCalledWith('requisitions');
  expect(query.select).toHaveBeenCalledWith('*, lignes:requisition_lignes(produit_id, unite_id)', { count: 'exact' });
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('actif', true);
  expect(query.eq).toHaveBeenCalledWith('statut', 'draft');
  expect(query.eq).toHaveBeenCalledWith('utilisateur_id', 'u2');
  expect(query.gte).toHaveBeenCalledWith('date_demande', '2025-01-01');
  expect(query.lte).toHaveBeenCalledWith('date_demande', '2025-01-31');
  expect(query.range).toHaveBeenCalledWith(10, 19);
});

test('createRequisition inserts header and lines', async () => {
  const { result } = renderHook(() => useRequisitions());
  await act(async () => {
    await result.current.createRequisition({ zone_id: 'z1', lignes: [{ produit_id: 'p1', quantite_demandee: 2, unite_id: 'u9' }] });
  });
  expect(fromMock).toHaveBeenCalledWith('requisitions');
  expect(query.insert).toHaveBeenCalled();
});

