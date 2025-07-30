import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import useAuth from '../src/hooks/useAuth.js';

const getSession = vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1', email: 'u@x.com' } } }, error: null }));
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));
const signOut = vi.fn(() => Promise.resolve({ error: null }));
const singleUser = vi.fn(() => Promise.resolve({ data: { id: '1', nom: 'User', mama_id: 1, role_id: 'r1', role_nom: 'superadmin', role_access_rights: {} }, error: null }));
const from = vi.fn(() => ({
  select: () => ({
    eq: () => ({
      single: singleUser,
    }),
  }),
}));

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { auth: { getSession, onAuthStateChange, signOut }, from }
}));

vi.mock('../src/lib/loginUser.js', () => ({ login: vi.fn() }));

test('role object is loaded and role name returned', async () => {
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => result.current.userData !== null);
  expect(result.current.role).toBe('superadmin');
  expect(result.current.roleData).toEqual({ id: 'r1', nom: 'superadmin', access_rights: {} });
});
