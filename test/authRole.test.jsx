import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import useAuth from '../src/hooks/useAuth.js';

const getSession = vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1', email: 'u@x.com' } } }, error: null }));
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));
const signOut = vi.fn(() => Promise.resolve({ error: null }));
const maybeSingle = vi.fn(() => Promise.resolve({ data: { id: '1', mama_id: 1, role_id: 1, role: { id: 'r1', nom: 'admin', access_rights: {} }, access_rights: {} }, error: null }));
const accessSelect = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [] })) }));
const from = vi.fn((table) => {
  if (table === 'access_rights') {
    return { select: accessSelect };
  }
  return { select: () => ({ eq: () => ({ maybeSingle }) }) };
});

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { auth: { getSession, onAuthStateChange, signOut }, from }
}));

vi.mock('../src/lib/loginUser.js', () => ({ login: vi.fn() }));

test('role is loaded from supabase', async () => {
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => result.current.role !== undefined);
  expect(result.current.role).toBe('admin');
});

test('logout when role missing', async () => {
  maybeSingle.mockResolvedValueOnce({ data: { id: '1', mama_id: 1, role_id: 1, role: null, access_rights: {} }, error: null });
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
  renderHook(() => useAuth(), { wrapper });
  await waitFor(() => signOut.mock.calls.length > 0);
  expect(signOut).toHaveBeenCalled();
});
