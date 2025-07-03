// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { vi, beforeEach } from 'vitest';
import RouterConfig from '../src/router.jsx';

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

const authState = {
  isAuthenticated: false,
  access_rights: { dashboard: true },
  loading: false,
};
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState
}));
vi.mock('@/hooks/useAuth', () => ({
  default: () => authState
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

test('root path shows landing even when authenticated', async () => {
  authState.isAuthenticated = true;
  render(
    <MemoryRouter initialEntries={["/"]}>
      <RouterConfig />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Simplifiez votre gestion/)).toBeInTheDocument();
  authState.isAuthenticated = false;
});
