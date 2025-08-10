// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

let mockHook;
vi.mock('@/hooks/useFournisseurs', () => ({
  useFournisseurs: () => mockHook(),
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
import { AuthProvider } from '@/context/AuthContext.jsx';
import { MemoryRouter } from 'react-router-dom';

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
  render(
    <MemoryRouter>
      <AuthProvider>
        <Fournisseurs />
      </AuthProvider>
    </MemoryRouter>
  );
  const button = await screen.findByText('Export Excel');
  fireEvent.click(button);
  expect(excel).toHaveBeenCalled();
});
