import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useMouvements', () => ({
  useMouvements: () => mockHook(),
}));
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ products: [{ id: 'p1', nom: 'Produit 1', unite: 'kg' }], fetchProducts: vi.fn() }),
}));
vi.mock('@/hooks/useZones', () => ({
  useZones: () => ({ zones: [{ id: 'z1', nom: 'Zone 1' }], fetchZones: vi.fn() }),
}));
vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: vi.fn(), success: vi.fn() },
}));

import Mouvements from '@/pages/stock/Mouvements.jsx';

const mouvementsData = [
  {
    id: '1',
    date: '2025-01-01',
    type: 'entree_manuelle',
    quantite: 5,
    zone_id: 'z1',
    produits: { nom: 'Produit 1', unite: 'kg' },
  },
];

function setup() {
  const fetch = vi.fn();
  const create = vi.fn(() => Promise.resolve({}));
  mockHook = () => ({ mouvements: mouvementsData, fetchMouvements: fetch, createMouvement: create });
  render(<Mouvements />);
  return { fetch, create };
}

test('renders mouvements table and submits form', async () => {
  const { fetch, create } = setup();
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  expect(screen.getByText('Produit 1', { selector: 'td' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /ajouter un mouvement/i }));
  const form = await waitFor(() => screen.getByLabelText('mouvement-form'));
  fireEvent.change(within(form).getByLabelText('Produit'), { target: { value: 'p1' } });
  fireEvent.change(within(form).getByLabelText('Type'), { target: { value: 'entree_manuelle' } });
  fireEvent.change(within(form).getByLabelText('Quantité'), { target: { value: '3' } });
  fireEvent.change(within(form).getByLabelText('Zone'), { target: { value: 'z1' } });
  fireEvent.click(within(form).getByRole('button', { name: /valider/i }));
  await waitFor(() => expect(create).toHaveBeenCalled());
});
