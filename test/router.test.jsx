// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  hasAccess: right => authState.access_rights.includes(right),
};
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState
}));
vi.mock('@/hooks/useMamaSettings', () => ({
  useMamaSettings: () => ({ featureFlags: {}, loading: false })
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: k => k })
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
  default: () => <div>Dashboard Stock & Achats</div>,
}));

vi.mock('@/pages/auth/Login.jsx', () => ({
  __esModule: true,
  default: () => <div>Login</div>,
}));

const qc = new QueryClient();

beforeEach(() => {
  authState.isAuthenticated = false;
});

// We test that navigating to '/' shows the login component when not authenticated
test('root path shows landing when unauthenticated', async () => {
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/"]}>
        <RouterConfig />
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(await screen.findByText(/Login/)).toBeInTheDocument();
});

test('root path redirects to dashboard when authenticated', async () => {
  authState.isAuthenticated = true;
  authState.userData = { actif: true };
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/"]}>
        <RouterConfig />
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(await screen.findByText(/Dashboard Stock/)).toBeInTheDocument();
  authState.isAuthenticated = false;
  authState.userData = null;
});
