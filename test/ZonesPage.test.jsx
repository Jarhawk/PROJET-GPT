// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

let mockHook;
const navigate = vi.fn();

vi.mock('@/hooks/useZones', () => ({ useZones: () => mockHook() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ hasAccess: () => true, loading: false }) }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

import Zones from '@/pages/parametrage/Zones.jsx';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };
});

test('new zone button navigates to creation form', async () => {
  mockHook = () => ({
    fetchZones: vi.fn().mockResolvedValue([]),
    updateZone: vi.fn(),
    deleteZone: vi.fn(),
  });
  render(
    <MemoryRouter>
      <Zones />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByText('+ Nouvelle zone'));
  expect(navigate).toHaveBeenCalledWith('/parametrage/zones/new');
});
