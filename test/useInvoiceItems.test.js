import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const afterInsert = { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'i1' }, error: null })) })) };
const afterUpdateSelect = { single: vi.fn(() => Promise.resolve({ data: { id: 'i1' }, error: null })) };
const updateEq2 = vi.fn(() => ({ select: vi.fn(() => afterUpdateSelect) }));
const updateEq1 = vi.fn(() => ({ eq: updateEq2 }));
const updateReturn = { eq: updateEq1 };
const deleteEq2 = vi.fn(() => Promise.resolve({ error: null }));
const deleteEq1 = vi.fn(() => ({ eq: deleteEq2 }));
const deleteReturn = { eq: deleteEq1 };
const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  order: vi.fn(() => Promise.resolve({ data: [], error: null })),
  insert: vi.fn(() => afterInsert),
  update: vi.fn(() => updateReturn),
  delete: vi.fn(() => deleteReturn),
  single: vi.fn(() => Promise.resolve({ data: { id: 'i1' }, error: null })),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
};
const fromMock = vi.fn(() => query);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('@/hooks/useAuditLog', () => ({ useAuditLog: () => ({ log: vi.fn() }) }));

let useInvoiceItems;

beforeEach(async () => {
  ({ useInvoiceItems } = await import('@/hooks/useInvoiceItems'));
  fromMock.mockClear();
  query.select.mockClear();
  query.eq.mockClear();
  query.order.mockClear();
  afterInsert.select.mockClear();
  afterUpdateSelect.single.mockClear();
  updateEq1.mockClear();
  updateEq2.mockClear();
  deleteEq1.mockClear();
  deleteEq2.mockClear();
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
  expect(query.select).toHaveBeenCalledWith('*, product: products(nom, famille, unite)');
  expect(query.eq).toHaveBeenNthCalledWith(1, 'facture_id', 'f1');
  expect(query.eq).toHaveBeenNthCalledWith(2, 'mama_id', 'm1');
  expect(query.order).toHaveBeenCalledWith('id');
});

test('addItem inserts row with invoice_id and mama_id', async () => {
  const { result } = renderHook(() => useInvoiceItems());
  await act(async () => {
    await result.current.addItem('f1', { product_id: 'p1' });
  });
  expect(fromMock).toHaveBeenCalledWith('facture_lignes');
  expect(query.insert).toHaveBeenCalledWith([{ product_id: 'p1', facture_id: 'f1', mama_id: 'm1' }]);
});

test('updateItem and deleteItem filter by id and mama_id', async () => {
  const { result } = renderHook(() => useInvoiceItems());
  await act(async () => {
    await result.current.updateItem('i1', { quantite: 2 });
  });
  expect(fromMock).toHaveBeenCalledWith('facture_lignes');
  expect(query.update).toHaveBeenCalledWith({ quantite: 2 });
  expect(updateEq1).toHaveBeenCalledWith('id', 'i1');
  expect(updateEq2).toHaveBeenCalledWith('mama_id', 'm1');

  await act(async () => {
    await result.current.deleteItem('i1');
  });
  expect(query.delete).toHaveBeenCalled();
  expect(deleteEq1).toHaveBeenCalledWith('id', 'i1');
  expect(deleteEq2).toHaveBeenCalledWith('mama_id', 'm1');
});
