// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  then: fn => Promise.resolve(fn({ data: [{ product_id: 'p1', quantite: 1, valeur: 2 }], error: null }))
};
const fromMock = vi.fn(() => query);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useSimulation;

beforeEach(async () => {
  ({ useSimulation } = await import('@/hooks/useSimulation'));
  fromMock.mockClear();
  query.select.mockClear();
  query.eq.mockClear();
});

test('getBesoinsParMenu queries view with ids', async () => {
  const { result } = renderHook(() => useSimulation());
  let data;
  await act(async () => {
    data = await result.current.getBesoinsParMenu('menu1', 2);
  });
  expect(fromMock).toHaveBeenCalledWith('v_besoins_previsionnels');
  expect(query.select).toHaveBeenCalledWith('*');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('menu_id', 'menu1');
  expect(data[0].quantite).toBe(2); // multiplied by nbPortions
});

test('simulerBudget aggregates scenario', async () => {
  const { result } = renderHook(() => useSimulation());
  let res;
  await act(async () => {
    res = await result.current.simulerBudget({}, [{ menu_id: 'mA', portions: 2 }]);
  });
  expect(fromMock).toHaveBeenCalled();
  expect(res.total).toBe(4); // valeur(2) * quantite(2)
});

test('proposerCommandes maps consommation', async () => {
  const { result } = renderHook(() => useSimulation());
  const out = await result.current.proposerCommandes([
    { product_id: 'p1', quantite: 3 },
  ]);
  expect(out).toEqual([{ product_id: 'p1', quantite: 3 }]);
});
