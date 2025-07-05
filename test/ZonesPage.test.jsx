// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useZones', () => ({
  useZones: () => mockHook(),
}));

import Zones from '@/pages/parametrage/Zones.jsx';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };
});

test('new zone button opens form and triggers add', async () => {
  const add = vi.fn();
  mockHook = () => ({
    zones: [],
    total: 0,
    fetchZones: vi.fn(),
    addZone: add,
    updateZone: vi.fn(),
    deleteZone: vi.fn(),
  });
  await act(async () => {
    render(<Zones />);
  });
  await act(async () => {
    fireEvent.click(screen.getByText('+ Nouvelle zone'));
  });
  const input = await screen.findByPlaceholderText('Nom de la zone');
  await act(async () => {
    fireEvent.change(input, { target: { value: 'Cuisine' } });
    fireEvent.click(screen.getByText('Enregistrer'));
  });
  expect(add).toHaveBeenCalledWith('Cuisine');
});
