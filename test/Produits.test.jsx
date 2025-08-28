// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

let mockProduits, mockFamilles, mockSousFamilles;
vi.mock('@/hooks/data/useProduits', () => ({ useProduits: () => mockProduits() }));
vi.mock('@/hooks/data/useFamilles', () => ({ useFamilles: () => mockFamilles() }));
vi.mock('@/hooks/data/useSousFamilles', () => ({ useSousFamilles: () => mockSousFamilles() }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ hasAccess: () => true, mama_id: 'm1' }),
}));

import Produits from '@/pages/produits/Produits.jsx';

test('affiche la liste des produits', async () => {
  mockProduits = () => ({
    data: { data: [{ id: '1', nom: 'Test', unite: { nom: 'kg' }, pmp: 1 }], count: 1 },
    isLoading: false,
    error: null,
  });
  mockFamilles = () => ({ familles: [], fetchFamilles: vi.fn() });
  mockSousFamilles = () => ({ data: [] });

  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Produits />
      </MemoryRouter>
    </QueryClientProvider>
  );

  expect(await screen.findByText('Test')).toBeInTheDocument();
});
