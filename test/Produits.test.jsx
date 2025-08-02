// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => mockHook(),
}));
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ hasAccess: () => true, mama_id: 'm1' })
}));
vi.mock('@/hooks/useStorage', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  pathFromUrl: () => '',
}));
vi.mock('@/hooks/useFamilles', () => ({
  useFamilles: () => ({ familles: [], fetchFamilles: vi.fn(), addFamille: vi.fn() })
}));
vi.mock('@/hooks/useUnites', () => ({
  useUnites: () => ({ unites: [], fetchUnites: vi.fn(), addUnite: vi.fn() })
}));
vi.mock('@/hooks/useFournisseurs', () => ({
  useFournisseurs: () => ({ fournisseurs: [], fetchFournisseurs: vi.fn() })
}));
vi.mock('@/hooks/useSousFamilles', () => ({
  useSousFamilles: () => ({
    sousFamilles: [],
    fetchSousFamilles: vi.fn(),
    loading: false,
    error: null,
    setSousFamilles: vi.fn(),
  }),
}));
vi.mock('@/hooks/useZonesStock', () => ({
  default: () => ({ zones: [], loading: false })
}));
vi.mock('@/utils/importExcelProduits', () => {
  const parseProduitsFile = vi.fn(() => []);
  const insertProduits = vi.fn(() => []);
  return { parseProduitsFile, insertProduits };
});
import { parseProduitsFile } from '@/utils/importExcelProduits';

import Produits from '@/pages/produits/Produits.jsx';

test('duplicate button calls hook', async () => {
  const duplicate = vi.fn();
  mockHook = () => ({
    products: [{ id: '1', nom: 'Test', famille: 'F', unite: 'kg', pmp: 1, stock_reel: 10, actif: true, zone_stock: { nom: 'Z' }, zone_stock_id: 'z1' }],
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

test('import input triggers parsing', async () => {
  mockHook = () => ({
    products: [],
    total: 0,
    fetchProducts: vi.fn(),
    exportProductsToExcel: vi.fn(),
    addProduct: vi.fn(),
    duplicateProduct: vi.fn(),
  });
  render(<Produits />);
  const input = screen.getByTestId('import-input');
  const file = new File([''], 'p.xlsx');
  await fireEvent.change(input, { target: { files: [file] } });
  expect(parseProduitsFile).toHaveBeenCalledWith(file, 'm1');
});
