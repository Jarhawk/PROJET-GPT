// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, beforeEach, test, expect } from 'vitest';
import { searchFournisseurs } from '@/hooks/useFournisseursAutocomplete';

const queryBuilder = {
  eq: vi.fn(() => queryBuilder),
  ilike: vi.fn(() => queryBuilder),
  order: vi.fn(() => queryBuilder),
  limit: vi.fn(() => queryBuilder),
  then: vi.fn((resolve) => resolve({ data: [], error: null })),
};

const selectMock = vi.fn(() => queryBuilder);
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: fromMock } }));

beforeEach(() => {
  fromMock.mockClear();
  selectMock.mockClear();
  queryBuilder.eq.mockClear();
  queryBuilder.ilike.mockClear();
  queryBuilder.order.mockClear();
  queryBuilder.limit.mockClear();
});

test('searchFournisseurs filters by mama_id and query', async () => {
  await searchFournisseurs('m1', 'paris');
  expect(fromMock).toHaveBeenCalledWith('fournisseurs');
  expect(selectMock).toHaveBeenCalledWith('id, nom');
  expect(queryBuilder.eq).toHaveBeenNthCalledWith(1, 'mama_id', 'm1');
  expect(queryBuilder.eq).toHaveBeenNthCalledWith(2, 'actif', true);
  expect(queryBuilder.ilike).toHaveBeenCalledWith('nom', '%paris%');
  expect(queryBuilder.order).toHaveBeenCalledWith('nom', { ascending: true });
  expect(queryBuilder.limit).toHaveBeenCalledWith(50);
});
