// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  order: vi.fn(() => Promise.resolve({ data: [], error: null })),
  single: vi.fn(() => Promise.resolve({ data: { id: 'i1' }, error: null })),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
};
const fromMock = vi.fn(() => query);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useInvoiceItems;

beforeEach(async () => {
  ({ useInvoiceItems } = await import('@/hooks/useInvoiceItems'));
  fromMock.mockClear();
  query.select.mockClear();
  query.eq.mockClear();
  query.order.mockClear();
  query.single.mockClear();
  query.insert.mockClear();
  query.update.mockClear();
  query.delete.mockClear();
});

test('fetchItemsByInvoice queries with invoice id and mama_id', async () => {
  const { result } = renderHook(() => useInvoiceItems());
  await act(async () => {
    await result.current.fetchItemsByInvoice('f1');
  });
  expect(fromMock).toHaveBeenCalledWith('facture_lignes');
  expect(query.select).toHaveBeenCalledWith(
    'id, facture_id, produit_id, quantite, prix_unitaire, total, mama_id, produit:produits!facture_lignes_produit_id_fkey(id, nom, mama_id, unite_id, unite:unite_id(nom, mama_id), famille:familles(id, nom, mama_id))'
  );
  expect(query.eq).toHaveBeenNthCalledWith(1, 'facture_id', 'f1');
  expect(query.eq).toHaveBeenNthCalledWith(2, 'mama_id', 'm1');
  expect(query.eq).toHaveBeenNthCalledWith(3, 'produit.mama_id', 'm1');
  expect(query.eq).toHaveBeenNthCalledWith(4, 'produit.unite.mama_id', 'm1');
  expect(query.eq).toHaveBeenNthCalledWith(5, 'produit.famille.mama_id', 'm1');
  expect(query.order).toHaveBeenCalledWith('id');
});

test('addItem inserts row with invoice_id and mama_id', async () => {
  const { result } = renderHook(() => useInvoiceItems());
  await act(async () => {
    await result.current.addItem('f1', { produit_id: 'p1' });
  });
  expect(fromMock).toHaveBeenCalledWith('facture_lignes');
  expect(query.insert).toHaveBeenCalledWith([{ produit_id: 'p1', facture_id: 'f1', mama_id: 'm1' }]);
});

test('updateItem and deleteItem filter by id and mama_id', async () => {
  const { result } = renderHook(() => useInvoiceItems());
  await act(async () => {
    await result.current.updateItem('i1', { quantite: 2 });
  });
  expect(fromMock).toHaveBeenCalledWith('facture_lignes');
  expect(query.update).toHaveBeenCalledWith({ quantite: 2 });
  expect(query.eq).toHaveBeenNthCalledWith(1, 'id', 'i1');
  expect(query.eq).toHaveBeenNthCalledWith(2, 'mama_id', 'm1');

  await act(async () => {
    await result.current.deleteItem('i1');
  });
  expect(query.delete).toHaveBeenCalled();
  expect(query.eq).toHaveBeenNthCalledWith(3, 'id', 'i1');
  expect(query.eq).toHaveBeenNthCalledWith(4, 'mama_id', 'm1');
});
