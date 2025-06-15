import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => mockHook(),
}));
vi.mock('@/hooks/useStorage', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  pathFromUrl: () => '',
}));

import Produits from '@/pages/produits/Produits.jsx';

test('duplicate button calls hook', async () => {
  const duplicate = vi.fn();
  mockHook = () => ({
    products: [{ id: '1', nom: 'Test', famille: 'F', unite: 'kg', pmp: 1, stock_reel: 10, actif: true }],
    total: 1,
    fetchProducts: vi.fn(),
    exportProductsToExcel: vi.fn(),
    importProductsFromExcel: vi.fn(() => Promise.resolve([])),
    addProduct: vi.fn(),
    duplicateProduct: duplicate,
  });
  render(<Produits />);
  const button = await screen.findByText('Dupliquer');
  fireEvent.click(button);
  expect(duplicate).toHaveBeenCalledWith('1');
});

test('import input calls hook and adds products', async () => {
  const importFn = vi.fn(() => Promise.resolve([{ nom: 'N', famille: 'F', unite: 'kg' }]));
  const add = vi.fn();
  mockHook = () => ({
    products: [],
    total: 0,
    fetchProducts: vi.fn(),
    exportProductsToExcel: vi.fn(),
    importProductsFromExcel: importFn,
    addProduct: add,
    duplicateProduct: vi.fn(),
  });
  render(<Produits />);
  const input = screen.getByTestId('import-input');
  const file = new File([''], 'p.xlsx');
  await fireEvent.change(input, { target: { files: [file] } });
  expect(importFn).toHaveBeenCalledWith(file);
  await waitFor(() => expect(add).toHaveBeenCalled());
});
