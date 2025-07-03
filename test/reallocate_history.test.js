// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, describe, it, expect } from 'vitest';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

const insert = vi.fn(() => Promise.resolve({}));
const rpc = vi.fn((name) => {
  if (name === 'mouvements_without_alloc') {
    return Promise.resolve({
      data: [
        { id: '1', produit_id: 'p1', quantite: -2, valeur: -4, mama_id: 'm1' },
        { id: '2', produit_id: 'p2', quantite: -1, valeur: -2, mama_id: 'm2' }
      ],
      error: null
    });
  }
  if (name === 'suggest_cost_centers') {
    return Promise.resolve({ data: [{ cost_center_id: 'cc1', ratio: 1 }], error: null });
  }
  return Promise.resolve({ data: [], error: null });
});

vi.mock('@supabase/supabase-js', () => {
  const createClient = vi.fn(() => ({ rpc, from: () => ({ insert }) }));
  return { createClient };
});

import { reallocateHistory } from '../scripts/reallocate_history.js';

describe('reallocateHistory', () => {
  it('runs without throwing', async () => {
    await expect(reallocateHistory(1)).resolves.not.toThrow();
    expect(rpc).toHaveBeenCalledWith('mouvements_without_alloc', { limit_param: 1 });
    expect(rpc).toHaveBeenCalledWith('suggest_cost_centers', { p_produit_id: 'p1' });
    expect(insert).toHaveBeenCalled();
  });

  it('supports generic SUPABASE vars', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    process.env.SUPABASE_URL = 'https://generic.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'gen';
    vi.resetModules();
    const { reallocateHistory: rh } = await import('../scripts/reallocate_history.js');
    await expect(rh(1)).resolves.not.toThrow();
    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://generic.supabase.co', 'gen');
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'key';
    vi.resetModules();
  });

  it('filters movements by mamaId argument', async () => {
    insert.mockClear();
    await reallocateHistory(2, 'm1');
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('reads mamaId from env', async () => {
    insert.mockClear();
    process.env.MAMA_ID = 'm2';
    await reallocateHistory(2);
    expect(insert).toHaveBeenCalledTimes(1);
    delete process.env.MAMA_ID;
  });

  it('reads limit from env', async () => {
    insert.mockClear();
    process.env.REALLOCATE_LIMIT = '2';
    await reallocateHistory();
    expect(rpc).toHaveBeenCalledWith('mouvements_without_alloc', { limit_param: 2 });
    delete process.env.REALLOCATE_LIMIT;
  });

  it('accepts explicit credentials', async () => {
    insert.mockClear();
    await reallocateHistory(1, null, 'https://cli.supabase.co', 'cli');
    const { createClient } = await import('@supabase/supabase-js');
    expect(createClient).toHaveBeenCalledWith('https://cli.supabase.co', 'cli');
  });

  it('skips inserts in dry-run mode', async () => {
    insert.mockClear();
    await reallocateHistory(1, null, null, null, true);
    expect(insert).not.toHaveBeenCalled();
  });

  it('parses -d flag via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return {
        ...actual,
        runScript: vi.fn(),
        isMainModule: () => true,
      };
    });
    await import('../scripts/reallocate_history.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['-d']);
    expect(result).toEqual([100, undefined, undefined, undefined, true]);
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('parses --mama-id via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return {
        ...actual,
        runScript: vi.fn(),
        isMainModule: () => true,
      };
    });
    await import('../scripts/reallocate_history.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['--mama-id', 'm7']);
    expect(result).toEqual([100, 'm7', undefined, undefined, false]);
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('parses --url and --key via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/reallocate_history.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['--url', 'u', '--key', 'k']);
    expect(result).toEqual([100, undefined, 'u', 'k', false]);
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('parses --limit via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/reallocate_history.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['--limit', '42']);
    expect(result).toEqual([42, undefined, undefined, undefined, false]);
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('parses env limit via runScript', async () => {
    vi.resetModules();
    process.env.REALLOCATE_LIMIT = '7';
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/reallocate_history.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse([]);
    expect(result).toEqual([7, undefined, undefined, undefined, false]);
    delete process.env.REALLOCATE_LIMIT;
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('ignores invalid env limit via runScript', async () => {
    vi.resetModules();
    process.env.REALLOCATE_LIMIT = 'x';
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/reallocate_history.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse([]);
    expect(result).toEqual([100, undefined, undefined, undefined, false]);
    delete process.env.REALLOCATE_LIMIT;
    vi.doUnmock('../scripts/cli_utils.js');
  });

  it('ignores invalid --limit via runScript', async () => {
    vi.resetModules();
    vi.doMock('../scripts/cli_utils.js', async () => {
      const actual = await vi.importActual('../scripts/cli_utils.js');
      return { ...actual, runScript: vi.fn(), isMainModule: () => true };
    });
    await import('../scripts/reallocate_history.js');
    const { runScript } = await import('../scripts/cli_utils.js');
    const parse = runScript.mock.calls[0][2];
    const result = parse(['--limit', '0']);
    expect(result).toEqual([100, undefined, undefined, undefined, false]);
    vi.doUnmock('../scripts/cli_utils.js');
  });
});
