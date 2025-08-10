// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act } from '@testing-library/react';
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
  await act(async () => {
    render(<InventaireZones />);
  });
  await act(async () => {
    fireEvent.click(screen.getByText('+ Nouvelle zone'));
  });
  const input = await screen.findByPlaceholderText('Nom de la zone');
  await act(async () => {
    fireEvent.change(input, { target: { value: 'Cuisine' } });
    fireEvent.click(screen.getByText('Enregistrer'));
  });
  expect(createZone).toHaveBeenCalledWith({ nom: 'Cuisine' });
});
