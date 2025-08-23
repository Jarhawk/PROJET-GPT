// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => mockHook(),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ hasAccess: () => true, mama_id: 'm1' })
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
vi.mock('@/hooks/data/useFournisseurs', () => ({
  default: () => ({ data: [], isLoading: false })
}));
vi.mock('@/hooks/useSousFamilles', () => ({
  useSousFamilles: () => ({
    sousFamilles: [],
    list: vi.fn(),
    loading: false,
    error: null,
  }),
}));
vi.mock('@/hooks/useZonesStock', () => ({
  useAuth: () => ({ zones: [], loading: false })
}));

import Produits from '@/pages/produits/Produits.jsx';

test('toggle button calls hook', async () => {
  const toggle = vi.fn();
  mockHook = () => ({
    products: [
      {
        id: '1',
        nom: 'Test',
        unite: { nom: 'kg' },
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
    loading: false,
  });
  render(<Produits />);
  const button = await screen.findByRole('button', { name: 'Désactiver' });
  fireEvent.click(button);
  expect(toggle).toHaveBeenCalledWith('1', false);
});
