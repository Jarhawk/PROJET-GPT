import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  gte: vi.fn(() => query),
  lte: vi.fn(() => query),
  order: vi.fn(() => query),
  insert: vi.fn(() => query),
  single: vi.fn(() => ({ data: { id: '1' }, error: null })),
  then: fn => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', user_id: 'u1' }) }));

let useMouvements;

beforeEach(async () => {
  ({ useMouvements } = await import('@/hooks/useMouvements'));
  fromMock.mockClear();
  Object.values(query).forEach(fn => fn.mockClear && fn.mockClear());
});

test('getMouvements applies filters', async () => {
  const { result } = renderHook(() => useMouvements());
  await act(async () => {
    await result.current.getMouvements({
      type: 'entree',
      produit: 'p1',
      zone_source: 'z1',
      zone_destination: 'z2',
      debut: '2025-01-01',
      fin: '2025-01-31',
    });
  });
  expect(fromMock).toHaveBeenCalledWith('stock_mouvements');
  expect(query.select).toHaveBeenCalledWith('*', { count: 'exact' });
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('type', 'entree');
  expect(query.eq).toHaveBeenCalledWith('produit_id', 'p1');
  expect(query.eq).toHaveBeenCalledWith('zone_source_id', 'z1');
  expect(query.eq).toHaveBeenCalledWith('zone_destination_id', 'z2');
  expect(query.gte).toHaveBeenCalledWith('date', '2025-01-01');
  expect(query.lte).toHaveBeenCalledWith('date', '2025-01-31');
});

test('createMouvement injects mama_id and auteur_id', async () => {
  const { result } = renderHook(() => useMouvements());
  await act(async () => {
    await result.current.createMouvement({ produit_id: 'p1', quantite: 1 });
  });
  expect(fromMock).toHaveBeenCalledWith('stock_mouvements');
  expect(query.insert).toHaveBeenCalledWith([{ produit_id: 'p1', quantite: 1, mama_id: 'm1', auteur_id: 'u1' }]);
});
