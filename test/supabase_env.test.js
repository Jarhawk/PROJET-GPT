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
  await import('../src/lib/supabase.js');
  expect(createClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'key');
  createClientMock.mockClear();
});

test('lib/supabase falls back to generic env', async () => {
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://generic.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'gen';
  vi.resetModules();
  await import('../src/lib/supabase.js');
  expect(createClientMock).toHaveBeenCalledWith('https://generic.supabase.co', 'gen');
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'key';
  vi.resetModules();
});

test('lib/supabase uses placeholders when env missing in tests', async () => {
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  vi.resetModules();
  await import('../src/lib/supabase.js');
  expect(createClientMock).toHaveBeenCalledWith('https://example.supabase.co', 'key');
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'key';
  vi.resetModules();
});

test('lib/supabase throws in production when env missing', async () => {
  const { status, stderr } = spawnSync(
    'node',
    ['-e', "import('./src/lib/supabase.js')"],
    {
      cwd: process.cwd(),
      env: { NODE_ENV: 'production', PATH: process.env.PATH },
      encoding: 'utf-8'
    }
  );
  expect(status).not.toBe(0);
  expect(stderr).toContain('Missing Supabase credentials');
});
