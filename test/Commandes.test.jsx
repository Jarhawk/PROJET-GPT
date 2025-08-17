import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('@/hooks/useCommandes', () => ({
  useCommandes: () => ({
    data: [],
    commandes: [],
    loading: false,
    fetchCommandes: vi.fn().mockResolvedValue({ data: [], count: 0 }),
    validateCommande: vi.fn(),
  }),
}));
vi.mock('@/hooks/data/useFournisseurs', () => ({ default: () => ({ data: [], isLoading: false }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1', role: 'admin' }) }));

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
