// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { supabase } from '../__mocks__/supabase.js';

vi.mock('@/lib/supabase', () => ({ supabase }));

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

import Sidebar from '@/layout/Sidebar.jsx';
import { AuthProvider } from '@/context/AuthContext';

describe('Sidebar', () => {
  beforeEach(() => {
    authMock = {
      user: {},
      userData: {},
      mama_id: 'abc',
      loading: false,
      access_rights: { produits: { peut_voir: true } },
      hasAccess: (m, d = 'peut_voir') => !!authMock.access_rights[m]?.[d],
    };
  });

  test('shows permitted links', () => {
    const wrapper = ({ children }) => (
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    );
    render(<Sidebar />, { wrapper });
    expect(screen.getByText('Produits')).toBeInTheDocument();
    expect(screen.queryByText('Factures')).not.toBeInTheDocument();
  });
});
