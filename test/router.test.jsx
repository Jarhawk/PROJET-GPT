// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, beforeEach } from 'vitest';
import RouterConfig from '../src/router.jsx';

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

const authState = {
  isAuthenticated: false,
  access_rights: ['dashboard'],
  loading: false,
  pending: false,
  userData: null,
};
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState
}));

vi.mock('@/hooks/useDashboard', () => ({
  useDashboard: () => ({
    stats: {},
    evolutionStock: [],
    evolutionConso: [],
    topProducts: [],
    foodCostGlobal: 0,
    foodCostParFamille: [],
    evolutionFoodCost: [],
    margeBrute: {},
    alertesStockBas: [],
    loading: false,
    error: null,
    fetchDashboard: vi.fn(),
    exportExcelDashboard: vi.fn(),
  })
}));

vi.mock('@/pages/Dashboard.jsx', () => ({
  __esModule: true,
  useAuth: () => <div>Dashboard Stock & Achats</div>,
}));

vi.mock('@/pages/auth/Login.jsx', () => ({
  __esModule: true,
  useAuth: () => <div>Login</div>,
}));

beforeEach(() => {
  authState.isAuthenticated = false;
});

// We test that navigating to '/' shows the login component when not authenticated
test('root path shows landing when unauthenticated', async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <RouterConfig />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Simplifiez votre gestion/)).toBeInTheDocument();
});

test('root path redirects to dashboard when authenticated', async () => {
  authState.isAuthenticated = true;
  authState.userData = { actif: true };
  render(
    <MemoryRouter initialEntries={["/"]}>
      <RouterConfig />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Dashboard Stock/)).toBeInTheDocument();
  authState.isAuthenticated = false;
  authState.userData = null;
});
