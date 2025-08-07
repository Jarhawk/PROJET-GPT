// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { supabase } from '../__mocks__/supabase.js';

vi.mock('@/lib/supabase', () => ({ supabase }));
vi.mock('@/components/ui/LoadingSpinner', () => ({ LoadingSpinner: () => <div>Loading...</div> }));
vi.mock('@/components/FactureLigne', () => ({ default: () => <tr><td>Ligne</td></tr> }));
vi.mock('@/components/ui/AutoCompleteField', () => ({ default: ({ onChange }) => (
  <input data-testid="fourn" onChange={() => onChange({ id: 'f1', nom: 'Fourn' })} />
)}));

const createFacture = vi.fn(() => Promise.resolve({ data: { id: '1' } }));
vi.mock('@/hooks/useFactures', () => ({
  useFactures: () => ({ createFacture, updateFacture: vi.fn() }),
}));
vi.mock('@/hooks/useProduitsAutocomplete', () => ({
  useProduitsAutocomplete: () => ({ results: [], searchProduits: vi.fn() }),
}));
vi.mock('@/hooks/useFournisseursAutocomplete', () => ({
  useFournisseursAutocomplete: () => ({ results: [], searchFournisseurs: vi.fn() }),
}));
vi.mock('@/hooks/useFactureForm', () => ({
  useFactureForm: () => ({ autoHt: 0, autoTva: 0, autoTotal: 0 }),
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

import FactureForm from '@/pages/factures/FactureForm.jsx';
import { AuthProvider } from '@/context/AuthContext';

describe('FactureForm', () => {
  beforeEach(() => {
    authMock = {
      mama_id: 'abc',
      loading: false,
      access_rights: { factures: { peut_voir: true } },
      hasAccess: () => true,
    };
  });

  test('submits facture', async () => {
    const wrapper = ({ children }) => (
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    );
    render(<FactureForm />, { wrapper });
    fireEvent.change(screen.getByPlaceholderText('Référence facture ou bon de livraison'), { target: { value: 'F1' } });
    fireEvent.change(screen.getByTestId('fourn'), { target: { value: 'x' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Ajouter'));
    });
    expect(createFacture).toHaveBeenCalled();
  });
});
