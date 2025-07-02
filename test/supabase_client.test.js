// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let createClientMock = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args) => createClientMock(...args),
}));

beforeEach(() => {
  createClientMock.mockClear();
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  vi.resetModules();
});

describe('getSupabaseClient', () => {
  it('uses explicit credentials when provided and caches the client', async () => {
    const mod = await import('../src/api/shared/supabaseClient.js');
    const a = mod.getSupabaseClient('https://cli.supabase.co', 'cli');
    const b = mod.getSupabaseClient('https://cli.supabase.co', 'cli');
    expect(a).toBe(b);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith('https://cli.supabase.co', 'cli');
  });

  it('falls back to env variables', async () => {
    process.env.SUPABASE_URL = 'https://env.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'env';
    const mod = await import('../src/api/shared/supabaseClient.js');
    mod.getSupabaseClient();
    expect(createClientMock).toHaveBeenCalledWith('https://env.supabase.co', 'env');
  });

  it('mixes cli and env credentials', async () => {
    process.env.SUPABASE_URL = 'https://env.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'env';
    let mod = await import('../src/api/shared/supabaseClient.js');
    mod.getSupabaseClient(null, 'cli');
    expect(createClientMock).toHaveBeenCalledWith('https://env.supabase.co', 'cli');
    const firstCalls = createClientMock.mock.calls.length;
    mod.getSupabaseClient(null, 'cli');
    expect(createClientMock).toHaveBeenCalledTimes(firstCalls); // cached
    vi.resetModules();
    createClientMock.mockClear();
    mod = await import('../src/api/shared/supabaseClient.js');
    mod.getSupabaseClient('https://cli.supabase.co');
    expect(createClientMock).toHaveBeenCalledWith('https://cli.supabase.co', 'env');
  });

  it('uses service role key when available', async () => {
    process.env.SUPABASE_URL = 'https://env.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    const mod = await import('../src/api/shared/supabaseClient.js');
    mod.getSupabaseClient();
    expect(createClientMock).toHaveBeenCalledWith('https://env.supabase.co', 'service');
  });

  it('throws when credentials missing', async () => {
    const mod = await import('../src/api/shared/supabaseClient.js');
    expect(() => mod.getSupabaseClient()).toThrow('Missing Supabase credentials');
  });
});
