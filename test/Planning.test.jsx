// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

let hook;
vi.mock('@/hooks/usePlanning', () => ({
  usePlanning: () => hook,
}));
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ mama_id: '1', hasAccess: () => true }),
}));
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ products: [{ id: 'p1', nom: 'Prod' }], fetchProducts: vi.fn() }),
}));

import PlanningForm from '@/pages/PlanningForm.jsx';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };
});

test('submits planning entry', async () => {
  const createPlanning = vi.fn(() => Promise.resolve({}));
  hook = {
    createPlanning,
    getPlannings: vi.fn(),
    updatePlanning: vi.fn(),
    deletePlanning: vi.fn(),
    loading: false,
    error: null,
  };
  await act(async () => {
    render(<PlanningForm />, { wrapper: MemoryRouter });
  });
  fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'Plan A' } });
  const dateInput = document.querySelector('input[type="date"]');
  fireEvent.input(dateInput, { target: { value: '2024-01-01' } });
  fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'p1' } });
  await act(async () => {
    fireEvent.click(screen.getByText('Enregistrer'));
  });
  expect(createPlanning).toHaveBeenCalled();
});
