// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, describe, it, expect } from 'vitest';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';
vi.mock('fs', () => ({
  default: { writeFileSync: vi.fn() },
  writeFileSync: vi.fn(),
}));
var eq;
vi.mock('@supabase/supabase-js', () => {
  const lt = vi.fn(() => Promise.resolve({ data: [], error: null }));
  const gte = vi.fn(() => ({ lt }));
  eq = vi.fn(() => ({ gte, lt }));
  const select = vi.fn(() => ({ eq, gte, lt }));
  const from = vi.fn(() => ({ select }));
  const createClient = vi.fn(() => ({ from }));
  return { createClient };
});
import { exportAccounting } from '../scripts/export_accounting.js';

describe('exportAccounting', () => {
  it('runs without throwing', async () => {
    await expect(exportAccounting('2024-01')).resolves.not.toThrow();
  });

  it('accepts generic SUPABASE env vars', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    process.env.SUPABASE_URL = 'https://generic.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'gen';
    vi.resetModules();
    const { exportAccounting: ea } = await import('../scripts/export_accounting.js');
    await expect(ea('2024-01')).resolves.not.toThrow();
    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://generic.supabase.co', 'gen');
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'key';
    vi.resetModules();
  });

  it('uses provided mamaId', async () => {
    await expect(exportAccounting('2024-01', 'm1')).resolves.not.toThrow();
    expect(eq).toHaveBeenCalledWith('mama_id', 'm1');
  });

  it('accepts explicit credentials', async () => {
    await expect(
      exportAccounting('2024-01', null, 'https://cli.supabase.co', 'cli')
    ).resolves.not.toThrow();
    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://cli.supabase.co', 'cli');
  });
});
