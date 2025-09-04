import { vi } from 'vitest';
import { makeSupabaseMock } from './mocks/supabaseClient.js';

globalThis.__SUPABASE_TEST_CLIENT__ = makeSupabaseMock({ data: [], error: null, count: 0 });

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => globalThis.__SUPABASE_TEST_CLIENT__,
  supabase: globalThis.__SUPABASE_TEST_CLIENT__,
  default: globalThis.__SUPABASE_TEST_CLIENT__,
}));
