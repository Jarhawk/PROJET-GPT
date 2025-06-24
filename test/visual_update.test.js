import { renderHook, act } from '@testing-library/react';
import { beforeAll, afterEach, test, expect, vi } from 'vitest';
import fs from 'fs';

// reset log file before tests
beforeAll(() => {
  fs.writeFileSync('test_visual_update.log', '');
});

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let fromMock;
let query;
let data = {};

function setup(table, initial = []) {
  data[table] = [...initial];
  query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    single: vi.fn(() => query),
    in: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    insert: vi.fn(rows => {
      rows.forEach(r => data[table].push({ id: String(data[table].length + 1), actif: true, ...r }));
      return query;
    }),
    update: vi.fn(fields => {
      if (data[table][0]) Object.assign(data[table][0], fields);
      return query;
    }),
    delete: vi.fn(() => {
      if (data[table][0]) data[table][0].actif = false;
      return query;
    }),
    then: cb => Promise.resolve(cb({ data: [...data[table]], count: data[table].length, error: null })),
  };
  fromMock = vi.fn(() => query);
  vi.mock('@/lib/supabase', () => ({ supabase: { from: (...args) => fromMock(...args) } }), { overwrite: true });
}

afterEach(() => {
  vi.resetModules();
});

async function log(msg) {
  fs.appendFileSync('test_visual_update.log', msg + '\n');
}

// Produits: create then disable
let useProducts;

test('produits creation and disable refresh list', async () => {
  setup('products', []);
  ({ useProducts } = await import('@/hooks/useProducts'));
  const { result } = renderHook(() => useProducts());

  await act(async () => {
    await result.current.addProduct({ nom: 'P', famille: 'F', unite: 'kg' });
  });

  const afterCreate = result.current.products.length === 1;
  await act(async () => {
    await result.current.toggleProductActive('1', false);
  });

  const afterDisable = result.current.products[0].actif === false;
  const fetchCount = fromMock.mock.calls.filter(c => c[0].includes('v_products')).length;
  await log(`Produits: creation ${afterCreate ? 'OK' : 'FAIL'}, disable ${afterDisable ? 'OK' : 'FAIL'}, refresh calls=${fetchCount}`);

  expect(afterCreate).toBe(true);
  expect(afterDisable).toBe(true);
});

// Fournisseurs: update name
let useFournisseurs;

test('fournisseurs update name refresh list', async () => {
  setup('fournisseurs', [{ id: '1', nom: 'Old', actif: true }]);
  ({ useFournisseurs } = await import('@/hooks/useFournisseurs'));
  const { result } = renderHook(() => useFournisseurs());

  await act(async () => {
    await result.current.updateFournisseur('1', { nom: 'New' });
  });

  const updated = result.current.fournisseurs[0].nom === 'New';
  await log(`Fournisseurs: update ${updated ? 'OK' : 'FAIL'}`);
  expect(updated).toBe(true);
});

// Factures: add then update total
let useInvoices;

test('factures add and update total refresh list', async () => {
  setup('factures', []);
  ({ useInvoices } = await import('@/hooks/useInvoices'));
  const { result } = renderHook(() => useInvoices());

  await act(async () => {
    await result.current.addInvoice({ montant: 10, fournisseur_id: '1', reference: 'A1', date: '2024-01-01' });
  });
  const created = result.current.invoices.length === 1;

  await act(async () => {
    await result.current.updateInvoice('1', { montant: 20 });
  });
  const updated = result.current.invoices[0].montant === 20;
  await log(`Factures: create ${created ? 'OK' : 'FAIL'}, update ${updated ? 'OK' : 'FAIL'}`);
  expect(created).toBe(true);
  expect(updated).toBe(true);
});

// Fiches: add then update portions
let useFiches;

test('fiches add and update portions refresh list', async () => {
  setup('fiches', []);
  ({ useFiches } = await import('@/hooks/useFiches'));
  const { result } = renderHook(() => useFiches());

  await act(async () => {
    await result.current.createFiche({ nom: 'F1', portions: 5, lignes: [] });
  });
  const created = result.current.fiches.length === 1;

  await act(async () => {
    await result.current.updateFiche('1', { portions: 8, lignes: [] });
  });
  const updated = result.current.fiches[0].portions === 8;
  await log(`Fiches: create ${created ? 'OK' : 'FAIL'}, update ${updated ? 'OK' : 'FAIL'}`);
  expect(created).toBe(true);
  expect(updated).toBe(true);
});

// Inventaires: add then archive
let useInventaires;

test('inventaires add and archive refresh list', async () => {
  setup('inventaires', []);
  ({ useInventaires } = await import('@/hooks/useInventaires'));
  const { result } = renderHook(() => useInventaires());

  await act(async () => {
    await result.current.createInventaire({ date: '2024-01-01', lignes: [] });
  });
  const created = result.current.inventaires.length === 1;

  await act(async () => {
    await result.current.deleteInventaire('1');
  });
  const archived = result.current.inventaires[0].actif === false;
  await log(`Inventaires: create ${created ? 'OK' : 'FAIL'}, archive ${archived ? 'OK' : 'FAIL'}`);
  expect(created).toBe(true);
  expect(archived).toBe(true);
});
