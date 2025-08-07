// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockGet;
vi.mock('@/hooks/useInventaires', () => ({ useInventaires: () => ({ getInventaireById: mockGet }) }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', loading: false }) }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ id: 'inv1' }), useNavigate: () => vi.fn() }));

import InventaireDetail from '@/pages/inventaire/InventaireDetail.jsx';

test('display inventory details', async () => {
  mockGet = vi.fn(() => Promise.resolve({
    id: 'inv1',
    date_inventaire: '2025-01-01',
    zone: 'Cuisine',
    lignes: [
      { quantite_reelle: 8, product: { nom: 'Prod1', unite: { nom: 'kg' }, stock_theorique: 5, pmp: 1 } },
    ],
  }));
  render(<InventaireDetail />);
  await waitFor(() => screen.getByText('Prod1'));
  expect(screen.getByText('Inventaire du 2025-01-01')).toBeInTheDocument();
  expect(screen.getByText('Prod1')).toBeInTheDocument();
  expect(screen.getByText('Valeur totale : 8.00 € – Écart global : 3.00 €')).toBeInTheDocument();
});
