import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { vi } from 'vitest';
import RouterConfig from '../src/router.jsx';

const authState = { isAuthenticated: false, access_rights: ['dashboard'], loading: false };
vi.mock('@/context/AuthContext', () => ({
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
  default: () => <div>Dashboard Stock & Achats</div>,
}));

vi.mock('@/pages/auth/Login.jsx', () => ({
  __esModule: true,
  default: () => <div>Login</div>,
}));

// We test that navigating to '/' shows the login component when not authenticated
test('root path redirects to login when unauthenticated', async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <RouterConfig />
    </MemoryRouter>
  );
  // Login component should be displayed
  expect(await screen.findByText('Login')).toBeInTheDocument();
});

test('root path redirects to dashboard when authenticated', async () => {
  authState.isAuthenticated = true;
  render(
    <MemoryRouter initialEntries={["/"]}>
      <RouterConfig />
    </MemoryRouter>
  );
  expect(await screen.findByText('Dashboard Stock & Achats')).toBeInTheDocument();
  authState.isAuthenticated = false;
});
