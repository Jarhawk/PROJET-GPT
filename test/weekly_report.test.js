// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, describe, it, expect } from 'vitest';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';
var rpc;
var createClient;
vi.mock('@supabase/supabase-js', () => {
  rpc = vi.fn().mockResolvedValue({ data: [] });
  createClient = vi.fn(() => ({ rpc }));
  return { createClient };
});
import { generateWeeklyCostCenterReport } from '../scripts/weekly_report.js';

describe('weekly report script', () => {
  it('runs without throwing', async () => {
    await expect(generateWeeklyCostCenterReport()).resolves.not.toThrow();
  });

  it('works with generic env vars', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    process.env.SUPABASE_URL = 'https://generic.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'gen';
    vi.resetModules();
    const { generateWeeklyCostCenterReport: fn } = await import('../scripts/weekly_report.js');
    await expect(fn()).resolves.not.toThrow();
    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://generic.supabase.co', 'gen');
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'key';
    vi.resetModules();
  });

  it('passes MAMA_ID to RPC', async () => {
    process.env.MAMA_ID = 'm1';
    vi.resetModules();
    const { generateWeeklyCostCenterReport: fn } = await import('../scripts/weekly_report.js');
    await expect(fn()).resolves.not.toThrow();
    expect(rpc).toHaveBeenCalledWith('stats_cost_centers', { mama_id_param: 'm1' });
    delete process.env.MAMA_ID;
    vi.resetModules();
  });

  it('accepts a mamaId argument', async () => {
    await expect(generateWeeklyCostCenterReport('m2')).resolves.not.toThrow();
    expect(rpc).toHaveBeenCalledWith('stats_cost_centers', { mama_id_param: 'm2' });
  });

  it('accepts explicit credentials', async () => {
    await expect(
      generateWeeklyCostCenterReport(null, 'https://cli.supabase.co', 'cli')
    ).resolves.not.toThrow();
    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://cli.supabase.co', 'cli');
  });
});
