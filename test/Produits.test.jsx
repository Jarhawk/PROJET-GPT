// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { supabase } from '../__mocks__/supabase.js';

vi.mock('@/lib/supabase', () => ({ supabase }));

let authMock;
vi.mock('@/context/AuthContext', async () => {
  const React = await import('react');
  const AuthContext = React.createContext(null);
  return {
    AuthContext,
    AuthProvider: ({ children }) => (
      <AuthContext.Provider value={authMock}>{children}</AuthContext.Provider>
    ),
    useAuth: () => authMock,
  };
});

let mockHook;
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => mockHook(),
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
import { AuthProvider } from '@/context/AuthContext';

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
  });
  authMock = {
    hasAccess: () => true,
    mama_id: 'm1',
    loading: false,
  };
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
  render(<Produits />, { wrapper });
  const buttons = await screen.findAllByText('Désactiver');
  fireEvent.click(buttons[0]);
  expect(toggle).toHaveBeenCalledWith('1', false);
});
