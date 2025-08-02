// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => mockHook(),
}));
vi.mock('@/hooks/useFamilles', () => ({
  useFamilles: () => ({ familles: [], fetchFamilles: vi.fn(), addFamille: vi.fn() })
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
vi.mock('@/hooks/useUnites', () => ({
  useUnites: () => ({ unites: [], fetchUnites: vi.fn(), addUnite: vi.fn() })
}));
vi.mock('@/hooks/useFournisseurs', () => ({
  useFournisseurs: () => ({ fournisseurs: [], fetchFournisseurs: vi.fn() })
}));

import ProduitForm from '@/components/produits/ProduitForm.jsx';

test('renders expected product inputs', () => {
  mockHook = () => ({ addProduct: vi.fn(), updateProduct: vi.fn(), loading: false });
  render(<ProduitForm onSuccess={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByLabelText(/Nom/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Famille/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Sous-famille/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Unité/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Allergènes/)).toBeInTheDocument();
  expect(screen.queryByLabelText(/Photo/)).toBeNull();
  expect(screen.getByLabelText(/Stock minimum/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Produit actif/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Fournisseur principal/)).toBeInTheDocument();
  expect(screen.queryByLabelText(/Code interne/)).toBeNull();
  expect(screen.queryByLabelText(/Stock réel/)).toBeNull();
});

test('PMP field is not rendered', () => {
  mockHook = () => ({ addProduct: vi.fn(), updateProduct: vi.fn(), loading: false });
  const { rerender } = render(<ProduitForm onSuccess={vi.fn()} onClose={vi.fn()} />);
  expect(screen.queryByLabelText(/PMP/)).toBeNull();
  rerender(
    <ProduitForm produit={{ id: '1', nom: 'p' }} onSuccess={vi.fn()} onClose={vi.fn()} />
  );
  expect(screen.queryByLabelText(/PMP/)).toBeNull();
});
