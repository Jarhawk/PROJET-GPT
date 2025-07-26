import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import useAuth from '../src/hooks/useAuth.js';

const getSession = vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1', email: 'u@x.com' } } }, error: null }));
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));
const signOut = vi.fn(() => Promise.resolve({ error: null }));
const maybeUser = vi.fn(() => Promise.resolve({ data: { id: '1', mama_id: 1, role_id: 'r1', access_rights: {} }, error: null }));
const maybeRole = vi.fn(() => Promise.resolve({ data: { id: 'r1', nom: 'admin', access_rights: {} }, error: null }));
const accessSelect = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [] })) }));
const from = vi.fn((table) => {
  if (table === 'access_rights') {
    return { select: accessSelect };
  }
  return { select: () => ({ eq: () => ({ maybeSingle: table === 'roles' ? maybeRole : maybeUser }) }) };
});

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { auth: { getSession, onAuthStateChange, signOut }, from }
}));

vi.mock('../src/lib/loginUser.js', () => ({ login: vi.fn() }));

test('access rights are loaded from supabase', async () => {
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => result.current.access_rights !== null);
  expect(result.current.access_rights).toEqual({});
});

test('user not found keeps userData null', async () => {
  maybeSingle.mockResolvedValueOnce({ data: null, error: null });
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => result.current.userData === null);
  expect(signOut).not.toHaveBeenCalled();
});
