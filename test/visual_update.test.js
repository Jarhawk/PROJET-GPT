// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { beforeAll, afterEach, test, expect, vi } from 'vitest';
import fs from 'fs';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// reset log file before tests
beforeAll(() => {
  fs.writeFileSync('test_visual_update.log', '');
});

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let fromMock;
let data = {};
const alias = { v_produits_dernier_prix: 'produits' };

function createQuery(table) {
  const target = alias[table] || table;
  let query;
  if (!data[target]) data[target] = [];
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
      rows.forEach(r => data[target].push({ id: String(data[target].length + 1), actif: true, ...r }));
      return query;
    }),
    update: vi.fn(fields => {
      if (data[target][0]) Object.assign(data[target][0], fields);
      return query;
    }),
    delete: vi.fn(() => {
      if (data[target].length > 0) data[target].splice(0, 1);
      return query;
    }),
    then: cb => Promise.resolve(cb({ data: [...data[target]], count: data[target].length, error: null })),
  };
  return query;
}

function setup(tables) {
  data = {};
  Object.entries(tables).forEach(([table, initial]) => {
    data[table] = [...initial];
  });
  fromMock = vi.fn(table => createQuery(table));
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
  setup({ produits: [], v_produits_dernier_prix: [] });
  ({ useProducts } = await import('@/hooks/useProducts'));
  const qc = new QueryClient();
  const wrapper = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc, children });
  const { result } = renderHook(() => useProducts(), { wrapper });

  await act(async () => {
    await result.current.addProduct({ nom: 'P', famille: 'F', unite_id: 'u1' });
  });

  const afterCreate = result.current.products.length === 1;
  await act(async () => {
    await result.current.toggleProductActive('1', false);
  });

  const afterDisable = result.current.products[0].actif === false;
  const fetchCount = fromMock.mock.calls.filter(c => c[0].includes('v_produits')).length;
  await log(`Produits: creation ${afterCreate ? 'OK' : 'FAIL'}, disable ${afterDisable ? 'OK' : 'FAIL'}, refresh calls=${fetchCount}`);

  expect(afterCreate).toBe(true);
  expect(afterDisable).toBe(true);
});

// Fournisseurs: update name
let useFournisseurs;

test('fournisseurs update name refresh list', async () => {
  setup({ fournisseurs: [{ id: '1', nom: 'Old', actif: true }] });
  ({ useFournisseurs } = await import('@/hooks/useFournisseurs'));
  const qc = new QueryClient();
  const wrapper = ({ children }) =>
    React.createElement(QueryClientProvider, { client: qc, children });
  const { result } = renderHook(() => useFournisseurs(), { wrapper });

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
  setup({ factures: [] });
  ({ useInvoices } = await import('@/hooks/useInvoices'));
  const { result } = renderHook(() => useInvoices());

  await act(async () => {
    await result.current.addInvoice({ montant: 10, fournisseur_id: '1', numero: 'A1', date_facture: '2024-01-01' });
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
  setup({ fiches: [], fiche_lignes: [] });
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
  setup({ inventaires: [] });
  ({ useInventaires } = await import('@/hooks/useInventaires'));
  const { result } = renderHook(() => useInventaires());

  await act(async () => {
    await result.current.createInventaire({ date: '2024-01-01', lignes: [] });
  });
  const created = result.current.inventaires.length === 1;

  await act(async () => {
    await result.current.deleteInventaire('1');
  });
  const deleted = result.current.inventaires.length === 0;
  await log(`Inventaires: create ${created ? 'OK' : 'FAIL'}, delete ${deleted ? 'OK' : 'FAIL'}`);
  expect(created).toBe(true);
  expect(deleted).toBe(true);
});
