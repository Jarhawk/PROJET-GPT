// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, describe, it, expect } from 'vitest';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';
vi.mock('fs', () => {
  const writeFileSync = vi.fn();
  const mkdirSync = vi.fn();
  return { default: { writeFileSync, mkdirSync }, writeFileSync, mkdirSync };
});
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

describe('exportAccounting', () => {
  it('runs without throwing', async () => {
    const { exportAccounting } = await import('../scripts/export_accounting.js');
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
    const { exportAccounting } = await import('../scripts/export_accounting.js');
    await expect(exportAccounting('2024-01', 'm1')).resolves.not.toThrow();
    expect(eq).toHaveBeenCalledWith('mama_id', 'm1');
  });

  it('accepts explicit credentials', async () => {
    const { exportAccounting } = await import('../scripts/export_accounting.js');
    await expect(
      exportAccounting('2024-01', null, 'https://cli.supabase.co', 'cli')
    ).resolves.not.toThrow();
    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://cli.supabase.co', 'cli');
  });

  it('writes to a custom file', async () => {
    const { exportAccounting: ea } = await import('../scripts/export_accounting.js');
    const result = await ea('2024-01', null, null, null, 'out.csv');
    expect(result).toBe('out.csv');
  });

  it('writes xlsx when format is xlsx', async () => {
    const { exportAccounting: ea } = await import('../scripts/export_accounting.js');
    const result = await ea('2024-01', null, null, null, null, 'xlsx');
    expect(result).toBe('invoices_2024-01.xlsx');
  });

  it('writes json when format is json', async () => {
    const { writeFileSync } = await import('fs');
    const { exportAccounting: ea } = await import('../scripts/export_accounting.js');
    const result = await ea('2024-01', null, null, null, null, 'json');
    expect(result).toBe('invoices_2024-01.json');
    expect(writeFileSync).toHaveBeenCalledWith('invoices_2024-01.json', expect.any(String));
  });

  it('honours ACCOUNTING_FORMAT env variable', async () => {
    process.env.ACCOUNTING_FORMAT = 'xlsx';
    vi.resetModules();
    const { exportAccounting: ea } = await import('../scripts/export_accounting.js');
    const result = await ea('2024-01');
    expect(result).toBe('invoices_2024-01.xlsx');
    delete process.env.ACCOUNTING_FORMAT;
    vi.resetModules();
  });

  it('honours ACCOUNTING_FORMAT when set to json', async () => {
    process.env.ACCOUNTING_FORMAT = 'json';
    vi.resetModules();
    const { writeFileSync } = await import('fs');
    const { exportAccounting: ea } = await import('../scripts/export_accounting.js');
    const result = await ea('2024-01');
    expect(result).toBe('invoices_2024-01.json');
    expect(writeFileSync).toHaveBeenCalledWith('invoices_2024-01.json', expect.any(String));
    delete process.env.ACCOUNTING_FORMAT;
    vi.resetModules();
  });

  it('writes to ACCOUNTING_DIR when no output is provided', async () => {
    process.env.ACCOUNTING_DIR = '/tmp';
    vi.resetModules();
    const { exportAccounting: ea } = await import('../scripts/export_accounting.js');
    const result = await ea('2024-01');
    expect(result).toMatch(/^\/tmp\/invoices_2024-01\.csv$/);
    delete process.env.ACCOUNTING_DIR;
    vi.resetModules();
  });

  it('creates ACCOUNTING_DIR if missing', async () => {
    process.env.ACCOUNTING_DIR = '/tmp/reports';
    vi.resetModules();
    const { mkdirSync } = await import('fs');
    const { exportAccounting: ea } = await import('../scripts/export_accounting.js');
    await ea('2024-01');
    expect(mkdirSync).toHaveBeenCalledWith('/tmp/reports', { recursive: true });
    delete process.env.ACCOUNTING_DIR;
    vi.resetModules();
  });

  it('parses --mama-id via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/export_accounting.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['2024-01', '--mama-id', 'm5']);
    expect(result).toEqual(['2024-01', 'm5', undefined, undefined, undefined, undefined]);
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('parses --url and --key via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/export_accounting.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['2024-01', '--url', 'u', '--key', 'k']);
    expect(result).toEqual(['2024-01', undefined, 'u', 'k', undefined, undefined]);
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('parses --format via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/export_accounting.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['2024-01', '--format', 'xlsx']);
    expect(result).toEqual(['2024-01', undefined, undefined, undefined, undefined, 'xlsx']);
    vi.doUnmock('../scripts/cli_utils.js');
  });
});
