import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { vi } from 'vitest';
import RouterConfig from '../src/router.jsx';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, access_rights: ['dashboard'], loading: false })
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

// We only test that navigating to '/' renders the dashboard component
// which implies the redirect is configured.
test('root path redirects to dashboard', async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <RouterConfig />
    </MemoryRouter>
  );
  // Check dashboard component is displayed
  expect(await screen.findByText('Dashboard Stock & Achats')).toBeInTheDocument();
});
