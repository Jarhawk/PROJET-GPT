// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryBuilder = {
  eq: vi.fn(() => queryBuilder),
  ilike: vi.fn(() => queryBuilder),
  order: vi.fn(() => queryBuilder),
  range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
  select: vi.fn(() => queryBuilder),
};

const fromMock = vi.fn(() => queryBuilder);

vi.mock('@/lib/supabaseClient', () => ({ default: { from: fromMock }, supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useProduitsSearch;

beforeEach(async () => {
  ({ useProduitsSearch } = await import('@/hooks/useProduitsSearch'));
  fromMock.mockClear();
  queryBuilder.eq.mockClear();
  queryBuilder.ilike.mockClear();
  queryBuilder.order.mockClear();
  queryBuilder.range.mockClear();
  queryBuilder.select.mockClear();
});

test('useProduitsSearch queries produits with pagination', async () => {
  const { result } = renderHook(() => useProduitsSearch('car', null, { page: 2, pageSize: 10 }));
  await act(async () => {});
  expect(fromMock).toHaveBeenCalledWith('produits');
  expect(queryBuilder.select).toHaveBeenCalledWith('id, nom, unite_id, zone_id, pmp, dernier_prix', { count: 'exact' });
  expect(queryBuilder.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryBuilder.eq).toHaveBeenCalledWith('actif', true);
  expect(queryBuilder.ilike).toHaveBeenCalledWith('nom', '%car%');
  expect(queryBuilder.order).toHaveBeenCalledWith('nom', { ascending: true });
  expect(queryBuilder.range).toHaveBeenCalledWith(10, 19);
  expect(result.current.total).toBe(0);
});
