import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('@/hooks/useCommandes', () => ({
  useCommandes: () => ({ data: [], commandes: [], loading: false, createCommande: vi.fn() }),
}));
vi.mock('@/hooks/data/useFournisseurs', () => ({ default: () => ({ data: [], isLoading: false }) }));
vi.mock('@/hooks/useProduitsFournisseur', () => ({ useProduitsFournisseur: () => ({ useProduitsDuFournisseur: () => ({ products: [], fetch: vi.fn() }) }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ role: 'admin' }) }));

import CommandeForm from '@/pages/commandes/CommandeForm.jsx';

test('renders commande form fields', () => {
  render(
    <MemoryRouter>
      <CommandeForm />
    </MemoryRouter>
  );
  expect(screen.getByLabelText(/Fournisseur/)).toBeInTheDocument();
  expect(screen.getByText(/Ajouter ligne/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Quantité/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Prix d’achat/)).toBeInTheDocument();
  expect(screen.getByLabelText(/Total ligne/)).toBeInTheDocument();
  expect(screen.getByText(/Valider commande/)).toBeInTheDocument();
});
