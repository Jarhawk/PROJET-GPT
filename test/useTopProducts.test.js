// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const fromMock = vi.fn();

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useTopProducts;

beforeEach(async () => {
  ({ useTopProducts } = await import('@/hooks/useTopProducts'));
  const rows = [
    { produit_id: 'p1', quantite: 2, requisitions: { statut: 'réalisée' } },
    { produit_id: 'p2', quantite: 1, requisitions: { statut: 'réalisée' } },
    { produit_id: 'p1', quantite: 3, requisitions: { statut: 'réalisée' } },
  ];
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    then: (resolve) => resolve({ data: rows, error: null }),
  });
});

test('fetchTop agrège les quantités par produit', async () => {
  const { result } = renderHook(() => useTopProducts());
  let top;
  await act(async () => {
    const res = await result.current.fetchTop({ limit: 2 });
    top = res.data;
  });
  expect(fromMock).toHaveBeenCalledWith('requisition_lignes');
  expect(top).toEqual([
    { produit_id: 'p1', quantite: 5 },
    { produit_id: 'p2', quantite: 1 },
  ]);
});
