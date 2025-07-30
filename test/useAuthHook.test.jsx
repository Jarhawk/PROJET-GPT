import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, expect, test } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import useAuth from '../src/hooks/useAuth.js';

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { auth: { getSession: vi.fn(() => ({ data: { session: null }, error: null })), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })), signOut: vi.fn(() => Promise.resolve({ error: null })) } }
}));

vi.mock('../src/lib/loginUser.js', () => ({ login: vi.fn(() => Promise.resolve({ data: {} })) }));

test('login is available via useAuth', () => {
  const wrapper = ({ children }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(typeof result.current.login).toBe('function');
});

test('useAuth throws if provider missing', () => {
  expect(() => renderHook(() => useAuth())).toThrow(
    'useAuth must be used within AuthProvider'
  );
});
