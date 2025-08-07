// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { supabase } from '../__mocks__/supabase.js';

vi.mock('@/lib/supabase', () => ({ supabase }));
vi.mock('@/components/ui/LoadingSpinner', () => ({ LoadingSpinner: () => <div>Loading...</div> }));
vi.mock('@/components/ui/select.js', () => ({ Select: ({ children, ...props }) => <select {...props}>{children}</select> }));

const updateFiche = vi.fn();
vi.mock('@/hooks/useFiches', () => ({
  useFiches: () => ({ createFiche: vi.fn(), updateFiche }),
}));
vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ products: [{ id: 'p1', nom: 'Prod', pmp: 1, unite: { nom: 'kg' } }], fetchProducts: vi.fn() }),
}));
vi.mock('@/hooks/useFamilles', () => ({
  useFamilles: () => ({ familles: [], fetchFamilles: vi.fn() }),
}));
vi.mock('@/hooks/useProduitsAutocomplete', () => ({
  useProduitsAutocomplete: () => ({ results: [], searchProduits: vi.fn() }),
}));
vi.mock('@/hooks/useFichesAutocomplete', () => ({
  useFichesAutocomplete: () => ({ results: [], searchFiches: vi.fn() }),
}));

let authMock;
vi.mock('@/context/AuthContext', async () => {
  const React = await import('react');
  const AuthContext = React.createContext(null);
  return {
    AuthContext,
    AuthProvider: ({ children }) => (
      <AuthContext.Provider value={authMock}>{children}</AuthContext.Provider>
    ),
    useAuth: () => authMock,
  };
});

import FicheForm from '@/pages/fiches/FicheForm.jsx';
import { AuthProvider } from '@/context/AuthContext';

describe('FicheForm', () => {
  beforeEach(() => {
    authMock = {
      loading: false,
      access_rights: { fiches_techniques: { peut_voir: true } },
      hasAccess: () => true,
    };
  });

  test('updates fiche', async () => {
    const wrapper = ({ children }) => (
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    );
    const fiche = { id: 'f1', nom: 'F1', lignes: [{ type: 'produit', produit_id: 'p1', quantite: 1 }], portions: 1, rendement: 1 };
    render(<FicheForm fiche={fiche} />, { wrapper });
    await act(async () => {
      fireEvent.submit(screen.getByText('Modifier').closest('form'));
    });
    await waitFor(() => expect(updateFiche).toHaveBeenCalled());
  });
});
