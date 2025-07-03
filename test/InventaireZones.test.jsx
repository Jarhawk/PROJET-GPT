// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useInventaireZones', () => ({
  useInventaireZones: () => mockHook(),
}));

import InventaireZones from '@/pages/inventaire/InventaireZones.jsx';

test('save calls createZone', async () => {
  const createZone = vi.fn();
  mockHook = () => ({
    zones: [],
    loading: false,
    getZones: vi.fn(),
    createZone,
    updateZone: vi.fn(),
    deleteZone: vi.fn(),
  });
  render(<InventaireZones />);
  fireEvent.click(screen.getByText('+ Nouvelle zone'));
  fireEvent.change(screen.getByPlaceholderText('Nom de la zone'), { target: { value: 'Cuisine' } });
  fireEvent.click(screen.getByText('Enregistrer'));
  expect(createZone).toHaveBeenCalledWith({ nom: 'Cuisine' });
});
