// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
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

import { useDashboardStats } from '@/hooks/useDashboardStats.js';
import { AuthProvider } from '@/context/AuthContext';

describe('useDashboardStats', () => {
  beforeEach(() => {
    authMock = { mama_id: 'm1', loading: false };
    supabase.rpc.mockResolvedValue({ data: [{ a: 1 }], error: null });
  });

  test('fetchStats calls supabase', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    renderHook(() => useDashboardStats(), { wrapper });
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalled();
    });
  });
});
