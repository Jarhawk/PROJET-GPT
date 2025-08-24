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
    'mama_id, id:produit_id, produit_id, nom, unite, fournisseur_id, fournisseur_nom, stock_actuel, stock_min, manque',
    { count: 'exact' }
  );
  expect(queryBuilder.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryBuilder.order).toHaveBeenCalledWith('manque', { ascending: false });
  expect(queryBuilder.range).toHaveBeenCalledWith(0, 19);
});
