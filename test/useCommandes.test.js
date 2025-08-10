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
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1', user_id: 'u1', role: 'admin' }) }));

let useCommandes;

beforeEach(async () => {
  ({ useCommandes } = await import('@/hooks/useCommandes'));
  fromMock.mockClear();
  Object.values(query).forEach(fn => fn.mockClear && fn.mockClear());
});

test('fetchCommandes applies filters', async () => {
  const { result } = renderHook(() => useCommandes());
  await act(async () => {
    await result.current.fetchCommandes({
      fournisseur: 'f1',
      statut: 'brouillon',
      debut: '2025-01-01',
      fin: '2025-01-31',
      page: 2,
    });
  });
  expect(fromMock).toHaveBeenCalledWith('commandes');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('fournisseur_id', 'f1');
  expect(query.eq).toHaveBeenCalledWith('statut', 'brouillon');
  expect(query.gte).toHaveBeenCalledWith('date_commande', '2025-01-01');
  expect(query.lte).toHaveBeenCalledWith('date_commande', '2025-01-31');
  expect(query.range).toHaveBeenCalledWith(20, 39);
});

test('createCommande inserts header and lines', async () => {
  const { result } = renderHook(() => useCommandes());
  await act(async () => {
    await result.current.createCommande({ fournisseur_id: 'f1', lignes: [{ produit_id: 'p1', quantite: 1, prix_achat: 2 }] });
  });
  expect(fromMock).toHaveBeenCalledWith('commandes');
  expect(query.insert).toHaveBeenCalled();
});
