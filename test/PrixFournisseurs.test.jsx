import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import PrixFournisseurs from '@/pages/fournisseurs/comparatif/PrixFournisseurs.jsx';

let mockHook;
vi.mock('@/hooks/useComparatif', () => ({
  useComparatif: (...args) => mockHook(...args),
}));

test('shows loader while loading comparatif', () => {
  mockHook = () => ({ lignes: [], loading: true, error: null });
  const { container } = render(<PrixFournisseurs produitId="1" />);
  expect(container.querySelector('.loader')).toBeInTheDocument();
});

test('displays error message when hook returns error', () => {
  mockHook = () => ({ lignes: [], loading: false, error: { message: 'Err' } });
  render(<PrixFournisseurs produitId="1" />);
  expect(screen.getByText('Err')).toBeInTheDocument();
});

test('renders table rows when data is available', () => {
  mockHook = () => ({
    lignes: [{ fournisseur: 'Acme', dernierPrix: 5, pmp: 4, nb: 2 }],
    loading: false,
    error: null,
  });
  render(<PrixFournisseurs produitId="1" />);
  expect(screen.getByText('Acme')).toBeInTheDocument();
  // verify prix
  expect(screen.getByText('5.00 €')).toBeInTheDocument();
});
