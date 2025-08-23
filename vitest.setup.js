// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import { vi } from 'vitest';

// Ensure test environment uses the dedicated .env.test file
dotenv.config({ path: '.env.test' });

vi.mock('@/contexts/AuthContext', () => {
  const fake = {
    user: { id: 'u-test', email: 'test@ex.com' },
    mamaId: '00000000-0000-0000-0000-000000000000',
    mama_id: '00000000-0000-0000-0000-000000000000',
    role: 'admin',
    access_rights: { '*': { read: true, create: true, update: true, delete: true } },
    loading: false,
    hasAccess: () => true,
  };
  return {
    useAuth: () => fake,
    AuthProvider: ({ children }) => children,
  };
});

vi.mock('@/hooks/useAuth', async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u-test' },
      mamaId: '00000000-0000-0000-0000-000000000000',
      mama_id: '00000000-0000-0000-0000-000000000000',
      role: 'admin',
      access_rights: { '*': { read: true, create: true, update: true, delete: true } },
      loading: false,
      hasAccess: () => true,
    }),
  };
});

// Supabase mock
function makeNoopClient() {
  const result = { data: [], error: null, count: 0 };
  const thenable = {
    then: (resolve) => resolve(result),
    catch: () => thenable,
    finally: () => thenable,
  };
  const chain = new Proxy(function () {}, {
    get: (_, prop) =>
      prop === 'then' || prop === 'catch' || prop === 'finally' ? thenable[prop] : chain,
    apply: () => chain,
  });
  return {
    from: () => chain,
    rpc: () => chain,
    storage: { from: () => chain },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  };
}

globalThis.__SUPABASE_TEST_CLIENT__ = makeNoopClient();

const originalMock = vi.mock;
vi.mock = (id, factory, options) => {
  if (id === '@/lib/supabase' && typeof factory === 'function') {
    return originalMock(
      id,
      () => {
        const result = factory();
        if (!result.getSupabaseClient) {
          if (result.supabase) {
            const value = result.supabase;
            result.getSupabaseClient = typeof value === 'function' ? value : () => value;
          } else {
            result.getSupabaseClient = () => globalThis.__SUPABASE_TEST_CLIENT__;
          }
        }
        return result;
      },
      options,
    );
  }
  return originalMock(id, factory, options);
};
