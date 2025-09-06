import { vi } from 'vitest';
import { makeSupabaseMock } from './mocks/supabaseClient.js';

globalThis.__SUPABASE_TEST_CLIENT__ = makeSupabaseMock({ data: [], error: null, count: 0 });

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => globalThis.__SUPABASE_TEST_CLIENT__,
  supabase: globalThis.__SUPABASE_TEST_CLIENT__,
  default: globalThis.__SUPABASE_TEST_CLIENT__,
}));

vi.mock('@/lib/db', () => ({
  getDb: () => ({ query: () => ({ rows: [] }) }),
  produits_list: vi.fn(async () => ({ data: [], count: 0, error: null })),
  produits_create: vi.fn(async () => ({ data: null, error: null })),
  produits_update: vi.fn(async () => ({ data: null, error: null })),
  produits_get: vi.fn(async () => ({ data: null, error: null })),
  produits_prices: vi.fn(async () => ({ data: [], error: null })),
  fournisseurs_list: vi.fn(async () => ({ data: [], error: null })),
  fournisseurs_create: vi.fn(async () => ({ data: null, error: null })),
  fournisseurs_update: vi.fn(async () => ({ error: null })),
  facture_create_with_lignes: vi.fn(async () => ({ data: null, error: null })),
}));
