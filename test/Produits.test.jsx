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

import Produits from '@/pages/produits/Produits.jsx';

test('toggle button calls hook', async () => {
  const toggle = vi.fn();
  mockHook = () => ({
    products: [
      {
        id: '1',
        nom: 'Test',
        unites: { nom: 'kg' },
        pmp: 1,
        stock_theorique: 10,
        actif: true,
        zone_stock: { nom: 'Z' },
        zone_stock_id: 'z1',
      },
    ],
    total: 1,
    fetchProducts: vi.fn(),
    exportProductsToExcel: vi.fn(),
    addProduct: vi.fn(),
    toggleProductActive: toggle,
  });
  render(<Produits />);
  const button = await screen.findByText('Désactiver');
  fireEvent.click(button);
  expect(toggle).toHaveBeenCalledWith('1', false);
});
