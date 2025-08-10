// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const listMock = vi.fn();
const moveMock = vi.fn(() => Promise.resolve({ error: null }));

vi.mock('@/hooks/useZoneProducts', () => ({
  useZoneProducts: () => ({ list: listMock, move: moveMock }),
}));
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let ZoneFormProducts;

beforeEach(async () => {
  ({ default: ZoneFormProducts } = await import('@/components/parametrage/ZoneFormProducts.jsx'));
  listMock.mockReset();
  moveMock.mockClear();
});

test('move triggers toast and refresh', async () => {
  listMock.mockResolvedValueOnce([{ id: '1', produit_nom: 'P', unite_id: 'u', stock_reel: 1, stock_min: 0 }]);
  listMock.mockResolvedValueOnce([]);
  window.prompt = vi.fn(() => 'z2');
  const { rerender } = render(<ZoneFormProducts zoneId="z1" />);
  await waitFor(() => expect(listMock).toHaveBeenCalledWith('z1'));
  fireEvent.click(screen.getByTestId('move-btn'));
  await waitFor(() => expect(moveMock).toHaveBeenCalledWith('z1', 'z2', true));
  const { toast } = await import('react-hot-toast');
  await waitFor(() => expect(toast.success).toHaveBeenCalled());
  await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
});
