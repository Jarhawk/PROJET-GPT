// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';

let mockActionsHook;
let mockDataHook;
vi.mock('@/hooks/useFournisseurs', () => ({
  useFournisseurs: () => mockActionsHook(),
}));
vi.mock('@/hooks/data/useFournisseurs', () => ({
  useFournisseurs: () => mockDataHook(),
}));
vi.mock('@/hooks/useFournisseurStats', () => ({
  useFournisseurStats: () => ({ fetchStatsAll: vi.fn(() => Promise.resolve([])) }),
}));
vi.mock('@/hooks/useProduitsFournisseur', () => ({
  useProduitsFournisseur: () => ({ getProduitsDuFournisseur: () => [] }),
}));
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ products: [] }),
}));
vi.mock('@/hooks/useInvoices', () => ({
  useInvoices: () => ({ fetchFacturesByFournisseur: vi.fn() }),
}));
vi.mock('@/hooks/useFournisseursInactifs', () => ({
  useFournisseursInactifs: () => ({ fournisseurs: [], fetchInactifs: vi.fn() }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ hasAccess: () => true }),
}));
// Minimal Supabase mock for AuthProvider
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
  },
}));
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
import { MemoryRouter } from 'react-router-dom';

test('export excel button triggers hook', async () => {
  const excel = vi.fn();
  mockActionsHook = () => ({
    createFournisseur: vi.fn(),
    updateFournisseur: vi.fn(),
    toggleFournisseurActive: vi.fn(),
    exportFournisseursToExcel: excel,
  });
  mockDataHook = () => ({ data: { data: [], count: 0 } });
  render(
    <MemoryRouter>
      <Fournisseurs />
    </MemoryRouter>
  );
  const button = await screen.findByText('Export Excel');
  fireEvent.click(button);
  expect(excel).toHaveBeenCalledWith([]);
});
