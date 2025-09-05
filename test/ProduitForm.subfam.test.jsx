// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import ProduitForm from '@/components/produits/ProduitForm.jsx';

const familles = [
  { id: 'f1', nom: 'F1' },
  { id: 'f2', nom: 'F2' },
];
const sousData = {
  f1: [ { id: 'sf1', nom: 'SF1', actif: true } ],
  f2: [ { id: 'sf2', nom: 'SF2', actif: true } ],
};

let addProductMock;

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ addProduct: addProductMock, updateProduct: vi.fn(), loading: false }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ mama_id: 'm1' }),
}));
vi.mock('@/hooks/useFamilles', () => ({
  useFamilles: () => ({ familles, fetchFamilles: vi.fn(), error: null }),
}));
vi.mock('@/hooks/useSousFamilles', () => {
  const { useState } = require('react');
  return {
    useSousFamilles: () => {
      const [sous, setSous] = useState([]);
      const list = async ({ familleId }) => {
        const data = sousData[familleId] || [];
        setSous(data);
        return { data };
      };
      return { sousFamilles: sous, list, loading: false, error: null };
    },
  };
});
vi.mock('@/hooks/useUnites', () => ({
  useUnites: () => ({ unites: [{ id: 'u1', nom: 'kg' }], fetchUnites: vi.fn() }),
}));
vi.mock('@/hooks/data/useFournisseurs', () => ({
  default: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/hooks/useZonesStock', () => ({ useZonesStock: () => ({ data: [] }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), loading: vi.fn() } }));

beforeEach(() => {
  addProductMock = vi.fn().mockResolvedValue({});
});

test('changement de famille filtre les sous-familles et reset la sélection', async () => {
  render(<ProduitForm onSuccess={vi.fn()} onClose={vi.fn()} />);
  const familleSelect = screen.getByLabelText(/Famille/);
  fireEvent.change(familleSelect, { target: { value: 'f1' } });
  await waitFor(() => expect(screen.getByText('SF1')).toBeInTheDocument());
  const sousSelect = screen.getByLabelText(/Sous-famille/);
  fireEvent.change(sousSelect, { target: { value: 'sf1' } });
  fireEvent.change(familleSelect, { target: { value: 'f2' } });
  await waitFor(() => expect(screen.getByText('SF2')).toBeInTheDocument());
  expect(screen.queryByText('SF1')).not.toBeInTheDocument();
  expect(screen.getByLabelText(/Sous-famille/).value).toBe('');
});

test('submit échoue sans sous-famille quand requise', async () => {
  render(<ProduitForm onSuccess={vi.fn()} onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Prod' } });
  fireEvent.change(screen.getByLabelText(/Famille/), { target: { value: 'f1' } });
  await waitFor(() => expect(screen.getByText('SF1')).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText(/Unité/), { target: { value: 'u1' } });
  fireEvent.click(screen.getByText('Créer'));
  expect(addProductMock).not.toHaveBeenCalled();
  expect(screen.getByText('Sous-famille requise')).toBeInTheDocument();
});
