// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let hook;
vi.mock('@/hooks/usePlanning', () => ({
  usePlanning: () => hook,
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ mama_id: '1' }),
}));

import Planning from '@/pages/Planning.jsx';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };
});

test('submits planning entry', async () => {
  const addPlanning = vi.fn(() => Promise.resolve({}));
  hook = {
    items: [],
    fetchPlanning: vi.fn(),
    addPlanning,
    updatePlanning: vi.fn(),
    deletePlanning: vi.fn(),
    loading: false,
    error: null,
  };
  await act(async () => {
    render(<Planning />);
  });
  const dateInput = document.querySelector('input[type="date"]');
  fireEvent.input(dateInput, { target: { value: '2024-01-01' } });
  fireEvent.change(screen.getByPlaceholderText('Notes'), { target: { value: 'test' } });
  await act(async () => {
    fireEvent.click(screen.getByText('Ajouter'));
  });
  expect(addPlanning).toHaveBeenCalledWith({ date_prevue: '2024-01-01', notes: 'test' });
});
