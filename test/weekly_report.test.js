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
vi.mock('fs', () => {
  const writeFileSync = vi.fn();
  const mkdirSync = vi.fn();
  return { default: { writeFileSync, mkdirSync }, writeFileSync, mkdirSync };
});
import * as XLSX from 'xlsx';
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
    expect(rpc).toHaveBeenCalledWith('stats_cost_centers', {
      mama_id_param: 'm1',
      debut_param: null,
      fin_param: null,
    });
    delete process.env.MAMA_ID;
    vi.resetModules();
  });

  it('falls back to VITE_MAMA_ID for RPC', async () => {
    process.env.VITE_MAMA_ID = 'vm1';
    vi.resetModules();
    const { generateWeeklyCostCenterReport: fn } = await import('../scripts/weekly_report.js');
    await expect(fn()).resolves.not.toThrow();
    expect(rpc).toHaveBeenCalledWith('stats_cost_centers', {
      mama_id_param: 'vm1',
      debut_param: null,
      fin_param: null,
    });
    delete process.env.VITE_MAMA_ID;
    vi.resetModules();
  });

  it('accepts a mamaId argument', async () => {
    await expect(generateWeeklyCostCenterReport('m2')).resolves.not.toThrow();
    expect(rpc).toHaveBeenCalledWith('stats_cost_centers', {
      mama_id_param: 'm2',
      debut_param: null,
      fin_param: null,
    });
  });

  it('accepts explicit credentials', async () => {
    await expect(
      generateWeeklyCostCenterReport(null, 'https://cli.supabase.co', 'cli')
    ).resolves.not.toThrow();
    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://cli.supabase.co', 'cli');
  });

  it('forwards start and end dates', async () => {
    await expect(
      generateWeeklyCostCenterReport(null, null, null, '2025-06-01', '2025-06-07')
    ).resolves.not.toThrow();
    expect(rpc).toHaveBeenCalledWith('stats_cost_centers', {
      mama_id_param: null,
      debut_param: '2025-06-01',
      fin_param: '2025-06-07',
    });
  });

  it('writes to a custom file', async () => {
    const writeSpy = vi.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
    const result = await generateWeeklyCostCenterReport(
      null,
      null,
      null,
      null,
      null,
      'out.xlsx'
    );
    expect(result).toBe('out.xlsx');
    expect(writeSpy).toHaveBeenCalledWith(expect.any(Object), 'out.xlsx');
    writeSpy.mockRestore();
  });

  it('writes csv when format is csv', async () => {
    const { writeFileSync } = await import('fs');
    await expect(
      generateWeeklyCostCenterReport(null, null, null, null, null, null, 'csv')
    ).resolves.not.toThrow();
    expect(writeFileSync).toHaveBeenCalledWith(
      'weekly_cost_centers.csv',
      expect.any(String)
    );
  });

  it('writes json when format is json', async () => {
    const { writeFileSync } = await import('fs');
    await expect(
      generateWeeklyCostCenterReport(null, null, null, null, null, null, 'json')
    ).resolves.not.toThrow();
    expect(writeFileSync).toHaveBeenCalledWith(
      'weekly_cost_centers.json',
      expect.any(String)
    );
  });

  it('returns the default file name', async () => {
    const result = await generateWeeklyCostCenterReport();
    expect(result).toBe('weekly_cost_centers.xlsx');
  });

  it('honours WEEKLY_REPORT_FORMAT env variable', async () => {
    process.env.WEEKLY_REPORT_FORMAT = 'csv';
    vi.resetModules();
    const { writeFileSync } = await import('fs');
    const { generateWeeklyCostCenterReport: fn } = await import('../scripts/weekly_report.js');
    await expect(fn()).resolves.not.toThrow();
    expect(writeFileSync).toHaveBeenCalledWith(
      'weekly_cost_centers.csv',
      expect.any(String)
    );
    delete process.env.WEEKLY_REPORT_FORMAT;
    vi.resetModules();
  });

  it('honours WEEKLY_REPORT_FORMAT when set to json', async () => {
    process.env.WEEKLY_REPORT_FORMAT = 'json';
    vi.resetModules();
    const { writeFileSync } = await import('fs');
    const { generateWeeklyCostCenterReport: fn } = await import('../scripts/weekly_report.js');
    await expect(fn()).resolves.not.toThrow();
    expect(writeFileSync).toHaveBeenCalledWith(
      'weekly_cost_centers.json',
      expect.any(String)
    );
    delete process.env.WEEKLY_REPORT_FORMAT;
    vi.resetModules();
  });

  it('writes inside REPORT_DIR when no output is given', async () => {
    process.env.REPORT_DIR = '/tmp';
    vi.resetModules();
    const { writeFileSync } = await import('fs');
    const { generateWeeklyCostCenterReport: fn } = await import('../scripts/weekly_report.js');
    await expect(fn(null, null, null, null, null, null, 'csv')).resolves.not.toThrow();
    expect(writeFileSync).toHaveBeenCalledWith('/tmp/weekly_cost_centers.csv', expect.any(String));
    delete process.env.REPORT_DIR;
    vi.resetModules();
  });

  it('creates REPORT_DIR if missing', async () => {
    process.env.REPORT_DIR = '/tmp/reports';
    vi.resetModules();
    const { mkdirSync } = await import('fs');
    const { generateWeeklyCostCenterReport: fn } = await import('../scripts/weekly_report.js');
    await expect(fn(null, null, null, null, null, null, 'csv')).resolves.not.toThrow();
    expect(mkdirSync).toHaveBeenCalledWith('/tmp/reports', { recursive: true });
    delete process.env.REPORT_DIR;
    vi.resetModules();
  });

  it('parses --mama-id via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/weekly_report.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['--mama-id', 'm9']);
    expect(result).toEqual(['m9', undefined, undefined, undefined, undefined, undefined, undefined]);
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('parses --url and --key via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/weekly_report.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['--url', 'u', '--key', 'k']);
    expect(result).toEqual([undefined, 'u', 'k', undefined, undefined, undefined, undefined]);
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('parses --format via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/weekly_report.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['--format', 'csv']);
    expect(result).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, 'csv']);
    vi.doUnmock('../scripts/cli_utils.js');
  });
});
