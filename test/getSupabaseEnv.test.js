import { describe, it, expect } from 'vitest';

let mod;

const resetEnv = () => {
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
};

describe('getSupabaseEnv', () => {
  beforeEach(() => {
    resetEnv();
  });

  it('uses Vite variables when defined', async () => {
    process.env.VITE_SUPABASE_URL = 'https://vite.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'vite';
    mod = await import('../src/api/shared/supabaseEnv.js');
    const creds = mod.getSupabaseEnv();
    expect(creds).toEqual({
      supabaseUrl: 'https://vite.supabase.co',
      supabaseKey: 'vite',
    });
  });

  it('falls back to generic variables', async () => {
    process.env.SUPABASE_URL = 'https://generic.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'gen';
    mod = await import('../src/api/shared/supabaseEnv.js');
    const creds = mod.getSupabaseEnv();
    expect(creds).toEqual({
      supabaseUrl: 'https://generic.supabase.co',
      supabaseKey: 'gen',
    });
  });

  it('throws when vars missing', async () => {
    mod = await import('../src/api/shared/supabaseEnv.js');
    expect(() => mod.getSupabaseEnv()).toThrow('Missing Supabase credentials');
  });
});
