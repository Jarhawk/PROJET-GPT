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

import ProduitForm from '@/components/produits/ProduitForm.jsx';

// ensure new fields render

test('renders additional product inputs', () => {
  mockHook = () => ({ addProduct: vi.fn(), updateProduct: vi.fn(), loading: false });
  render(
    <ProduitForm familles={[]} unites={[]} onSuccess={vi.fn()} onClose={vi.fn()} />
  );
  expect(screen.getByLabelText(/Code interne/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Allergènes/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Stock minimum/)).toBeInTheDocument();
});
