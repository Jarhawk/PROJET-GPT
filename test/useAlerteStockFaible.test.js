// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryBuilder = {
  eq: vi.fn(() => queryBuilder),
  order: vi.fn(() => queryBuilder),
  range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
  select: vi.fn(() => queryBuilder),
};
const fromMock = vi.fn(() => queryBuilder);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

let useAlerteStockFaible;

beforeEach(async () => {
  ({ useAlerteStockFaible } = await import('@/hooks/useAlerteStockFaible'));
  fromMock.mockClear();
  queryBuilder.eq.mockClear();
  queryBuilder.order.mockClear();
  queryBuilder.range.mockClear();
  queryBuilder.select.mockClear();
});

test('useAlerteStockFaible queries v_alertes_rupture with mama filter', async () => {
  const { result } = renderHook(() => useAlerteStockFaible());
  await waitFor(() => !result.current.loading);
  expect(fromMock).toHaveBeenCalledWith('v_alertes_rupture');
  expect(queryBuilder.select).toHaveBeenCalledWith(
    'mama_id, produit_id, nom, unite, fournisseur_nom, stock_min, stock_actuel, manque',
    { count: 'exact' }
  );
  expect(queryBuilder.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryBuilder.order).toHaveBeenCalledWith('manque', { ascending: false });
  expect(queryBuilder.range).toHaveBeenCalledWith(0, 19);
});

test('useAlerteStockFaible returns fetched rows', async () => {
  queryBuilder.range.mockResolvedValueOnce({
    data: [
      {
        mama_id: 'm1',
        produit_id: 1,
        nom: 'p',
        unite: 'u',
        fournisseur_nom: 'f',
        stock_actuel: 5,
        stock_min: 10,
        manque: 5,
      },
    ],
    count: 1,
    error: null,
  });

  const { result } = renderHook(() => useAlerteStockFaible());
  await waitFor(() => !result.current.loading);
  expect(queryBuilder.range).toHaveBeenCalledTimes(1);
  expect(result.current.data[0].nom).toBe('p');
});
