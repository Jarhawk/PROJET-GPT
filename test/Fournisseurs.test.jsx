import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useFournisseurs', () => ({
  useFournisseurs: () => mockHook(),
}));
vi.mock('@/hooks/useFournisseurStats', () => ({
  useFournisseurStats: () => ({ fetchStatsAll: vi.fn(() => Promise.resolve([])) }),
}));
vi.mock('@/hooks/useSupplierProducts', () => ({
  useSupplierProducts: () => ({ getProductsBySupplier: () => [] }),
}));
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ products: [] }),
}));
vi.mock('@/hooks/useInvoices', () => ({
  useInvoices: () => ({ fetchInvoicesBySupplier: vi.fn() }),
}));
vi.mock('@/hooks/useFournisseursInactifs', () => ({
  useFournisseursInactifs: () => ({ fournisseurs: [], fetchInactifs: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import Fournisseurs from '@/pages/fournisseurs/Fournisseurs.jsx';

test('export excel button triggers hook', async () => {
  const excel = vi.fn();
  mockHook = () => ({
    fournisseurs: [],
    total: 0,
    getFournisseurs: vi.fn(),
    createFournisseur: vi.fn(),
    updateFournisseur: vi.fn(),
    disableFournisseur: vi.fn(),
    exportFournisseursToExcel: excel,
  });
  render(<Fournisseurs />);
  const button = await screen.findByText('Export Excel');
  fireEvent.click(button);
  expect(excel).toHaveBeenCalled();
});
