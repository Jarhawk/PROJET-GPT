// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

let mockHook;
vi.mock('@/hooks/useProductsView', () => ({
  useProductsView: () => mockHook(),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ hasAccess: () => true, mama_id: 'm1' })
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
      },
    ],
    total: 1,
    fetchProducts: vi.fn(),
    toggleProductActive: toggle,
  });
  render(
    <MemoryRouter>
      <Produits />
    </MemoryRouter>
  );
  const button = await screen.findByText('Désactiver');
  fireEvent.click(button);
  expect(toggle).toHaveBeenCalledWith('1', false);
});
