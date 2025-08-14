// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

beforeEach(() => {
  process.env.VITE_SUPABASE_URL = 'https://env.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'env';
  vi.resetModules();
});

describe('getSupabaseClient', () => {
  it('returns the singleton supabase client', async () => {
    const { getSupabaseClient } = await import('../src/api/shared/supabaseClient.js');
    const { supabase } = await import('../src/lib/supabaseClient.js');
    expect(getSupabaseClient()).toBe(supabase);
  });
});
