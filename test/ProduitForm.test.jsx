// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
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
vi.mock('@/hooks/useFamilles', () => ({
  useFamilles: () => ({ familles: [], fetchFamilles: vi.fn(), addFamille: vi.fn() })
}));
vi.mock('@/hooks/useUnites', () => ({
  useUnites: () => ({ unites: [], fetchUnites: vi.fn(), addUnite: vi.fn() })
}));
vi.mock('@/hooks/useZones', () => ({
  useZones: () => ({ zones: [], fetchZones: vi.fn() })
}));
vi.mock('@/hooks/useFournisseurs', () => ({
  useFournisseurs: () => ({ fournisseurs: [], fetchFournisseurs: vi.fn() })
}));

import ProduitForm from '@/components/produits/ProduitForm.jsx';

// ensure new fields render

test('renders additional product inputs', () => {
  mockHook = () => ({ addProduct: vi.fn(), updateProduct: vi.fn(), loading: false });
  render(
    <ProduitForm onSuccess={vi.fn()} onClose={vi.fn()} />
  );
  expect(screen.getByLabelText(/Code interne/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Allergènes/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Stock minimum/)).toBeInTheDocument();
});

test('PMP input read-only or hidden', () => {
  mockHook = () => ({ addProduct: vi.fn(), updateProduct: vi.fn(), loading: false });
  // create mode: no PMP field
  const { rerender } = render(
    <ProduitForm onSuccess={vi.fn()} onClose={vi.fn()} />
  );
  expect(screen.queryByLabelText(/PMP/)).toBeNull();

  // edit mode: PMP displayed but disabled
  rerender(
    <ProduitForm
      produit={{ id: '1', nom: 'p', famille: 'f', unite: 'u', pmp: 5 }}
      onSuccess={vi.fn()}
      onClose={vi.fn()}
    />
  );
  const input = screen.getByDisplayValue('5');
  expect(input).toBeDisabled();
  expect(input).toHaveValue(5);
});
