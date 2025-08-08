import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('@/hooks/useCommandes', () => ({
  useCommandes: () => ({
    commandes: [],
    loading: false,
    fetchCommandes: vi.fn().mockResolvedValue({ data: [], count: 0 }),
    validateCommande: vi.fn(),
  }),
}));
vi.mock('@/hooks/useFournisseurs', () => ({ useFournisseurs: () => ({ fournisseurs: [], fetchFournisseurs: vi.fn() }) }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', role: 'admin' }) }));

import Commandes from '@/pages/commandes/Commandes.jsx';

test('renders commandes page with filters', async () => {
  render(
    <MemoryRouter>
      <Commandes />
    </MemoryRouter>
  );
  await screen.findByText(/Nouvelle commande/);
  expect(screen.getByLabelText(/Fournisseur/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Statut/)).toBeInTheDocument();
  expect(screen.getByText(/Référence/)).toBeInTheDocument();
});
