import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true, loading: false }) }));

let mockTransferts;
let mockProducts;
let mockZones;

vi.mock('@/hooks/useTransferts', () => ({ useTransferts: () => mockTransferts() }));
vi.mock('@/hooks/useProducts', () => ({ useProducts: () => mockProducts() }));
vi.mock('@/hooks/useZones', () => ({ useZones: () => mockZones() }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

import Transferts from '@/pages/stock/Transferts.jsx';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };
});

test('renders transferts and submits form', async () => {
  const createTransfert = vi.fn(() => Promise.resolve({}));
  const transfertsValue = {
    transferts: [
      {
        id: 't1',
        date_transfert: '2025-01-01',
        zone_source: { nom: 'A' },
        zone_destination: { nom: 'B' },
        lignes: [{ produit_id: 'p1' }],
      },
    ],
    fetchTransferts: vi.fn(),
    createTransfert,
  };
  mockTransferts = () => transfertsValue;
  const productsValue = {
    products: [{ id: 'p1', nom: 'Prod1' }],
    fetchProducts: vi.fn(),
  };
  mockProducts = () => productsValue;
  const zonesValue = {
    zones: [{ id: 'A', nom: 'A' }, { id: 'B', nom: 'B' }],
    fetchZones: vi.fn(),
    myAccessibleZones: vi.fn(() => [{ id: 'A', nom: 'A' }, { id: 'B', nom: 'B' }]),
  };
  mockZones = () => zonesValue;

  await act(async () => {
    render(<Transferts />);
  });

  expect(screen.getByText('2025-01-01')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByText('Nouveau transfert'));
  });

  const modal = screen.getAllByText('Nouveau transfert')[1].closest('div');
  const selects = within(modal).getAllByRole('combobox');
  await act(async () => {
    fireEvent.change(selects[0], { target: { value: 'A' } });
    fireEvent.change(selects[1], { target: { value: 'B' } });
    fireEvent.change(selects[2], { target: { value: 'p1' } });
  });
  const qty = within(modal).getByRole('spinbutton');
  await act(async () => {
    fireEvent.change(qty, { target: { value: '2' } });
    fireEvent.click(within(modal).getByText('Valider'));
  });
  expect(createTransfert).toHaveBeenCalled();
});

