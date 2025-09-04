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

test('useAlerteStockFaible queries v_alertes_rupture without mama filter', async () => {
  const { result } = renderHook(() => useAlerteStockFaible());
  await waitFor(() => !result.current.loading);
  expect(fromMock).toHaveBeenCalledWith('v_alertes_rupture');
  expect(queryBuilder.select).toHaveBeenCalledWith(
    'id:produit_id, produit_id, nom, unite, fournisseur_id, fournisseur_nom, stock_actuel, stock_min, manque, consommation_prevue, receptions, stock_projete',
    { count: 'exact' }
  );
  expect(queryBuilder.eq).not.toHaveBeenCalled();
  expect(queryBuilder.order).toHaveBeenCalledWith('manque', { ascending: false });
  expect(queryBuilder.range).toHaveBeenCalledWith(0, 19);
});

test('useAlerteStockFaible falls back when stock_projete missing', async () => {
  queryBuilder.range
    .mockResolvedValueOnce({ data: null, count: 0, error: { code: '42703' } })
    .mockResolvedValueOnce({
      data: [
        {
          produit_id: 1,
          nom: 'p',
          stock_actuel: 5,
          consommation_prevue: 3,
          receptions: 2,
        },
      ],
      count: 1,
      error: null,
    });

  const { result } = renderHook(() => useAlerteStockFaible());
  await waitFor(() => !result.current.loading);
  expect(queryBuilder.range).toHaveBeenCalledTimes(2);
  expect(result.current.data[0].stock_projete).toBe(4);
});
