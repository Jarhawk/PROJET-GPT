// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import { vi } from 'vitest';

// Ensure test environment uses the dedicated .env.test file
dotenv.config({ path: '.env.test' });

process.env.VITE_SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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
