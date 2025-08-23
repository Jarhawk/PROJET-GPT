import { vi, test, expect } from 'vitest';
import { spawnSync } from 'node:child_process';

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

let createClientMock;
vi.mock('@supabase/supabase-js', () => {
  createClientMock = vi.fn(() => ({}));
  return { createClient: createClientMock };
});

test('lib/supabase uses Vite env by default', async () => {
  vi.unmock('@/lib/supabase');
  const { getSupabaseClient } = await import('../src/lib/supabase.js');
  getSupabaseClient();
  expect(createClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'key');
  createClientMock.mockClear();
});

test('lib/supabase falls back to generic env', async () => {
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://generic.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'gen';
  vi.resetModules();
  vi.unmock('@/lib/supabase');
  const { getSupabaseClient } = await import('../src/lib/supabase.js');
  getSupabaseClient();
  expect(createClientMock).toHaveBeenCalledWith('https://generic.supabase.co', 'gen');
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'key';
  createClientMock.mockClear();
  vi.resetModules();
});

test('lib/supabase uses placeholders when env missing in tests', async () => {
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  vi.resetModules();
  vi.unmock('@/lib/supabase');
  const { getSupabaseClient } = await import('../src/lib/supabase.js');
  getSupabaseClient();
  expect(createClientMock).not.toHaveBeenCalled();
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'key';
  createClientMock.mockClear();
  vi.resetModules();
});

test('lib/supabase throws in production when env missing', async () => {
  const { status, stderr } = spawnSync(
    'node',
    [
      '-e',
      "import('./src/lib/supabase.js').then(m => m.getSupabaseClient())",
    ],
    {
      cwd: process.cwd(),
      env: { NODE_ENV: 'production', PATH: process.env.PATH },
      encoding: 'utf-8',
    }
  );
  expect(status).not.toBe(0);
  expect(stderr).toContain('Missing Supabase credentials');
});
