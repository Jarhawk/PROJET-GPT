// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockCreate;
vi.mock('@/hooks/useInventaires', () => ({ useInventaires: () => ({ createInventaire: mockCreate }) }));
vi.mock('@/hooks/useProduitsInventaire', () => ({
  useProduitsInventaire: () => ({
    produits: [
      { id: 'p1', nom: 'Prod1', unite: 'kg', pmp: 1, stock_theorique: 5 },
      { id: 'p2', nom: 'Prod2', unite: 'l', pmp: 2, stock_theorique: 3 },
    ],
    fetchProduits: vi.fn(),
  }),
}));
vi.mock('@/hooks/useInventaireZones', () => ({ useInventaireZones: () => ({ zones: [], getZones: vi.fn() }) }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', hasAccess: () => true, loading: false }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

import InventaireForm from '@/pages/inventaire/InventaireForm.jsx';

test('generate lines and submit', async () => {
  mockCreate = vi.fn(() => Promise.resolve({ id: 'inv1' }));
  await act(async () => {
    render(<InventaireForm />);
  });
  await act(async () => {
    fireEvent.click(screen.getByText('Générer lignes'));
  });
  // two product rows should appear
  expect(await screen.findByText('Prod1')).toBeInTheDocument();
  const inputs = screen.getAllByRole('spinbutton');
  await act(async () => {
    fireEvent.change(inputs[0], { target: { value: '8' } });
  });
  await act(async () => {
    fireEvent.click(screen.getByText('Enregistrer'));
  });
  expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
    lignes: [
      { produit_id: 'p1', quantite_reelle: 8 },
      { produit_id: 'p2', quantite_reelle: 3 },
    ],
  }));
});
