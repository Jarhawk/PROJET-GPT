import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

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
    fetchDashboard: vi.fn(),
    exportExcelDashboard: vi.fn(),
  })
}));
vi.mock('@/hooks/usePriceTrends', () => ({
  usePriceTrends: () => ({ data: [], fetchTrends: vi.fn() })
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
}));

import Dashboard from '@/pages/Dashboard.jsx';

test('dashboard shows quick action links', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
  expect(screen.getByText('+ Produit')).toBeInTheDocument();
  expect(screen.getByText('+ Facture')).toBeInTheDocument();
  expect(screen.getByText('+ Inventaire')).toBeInTheDocument();
  expect(screen.getByText('Voir mouvements')).toBeInTheDocument();
});
