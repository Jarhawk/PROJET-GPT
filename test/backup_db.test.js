// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, test, expect, beforeEach } from 'vitest';
import { writeFileSync } from 'fs';

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

const eqMock = vi.fn(() => ({ data: [], error: null }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
let createClientMock;
vi.mock('@supabase/supabase-js', () => {
  createClientMock = vi.fn(() => ({ from: fromMock }));
  return { createClient: createClientMock };
});
vi.mock('fs', () => {
  const writeFileSyncMock = vi.fn();
  const mkdirSyncMock = vi.fn();
  return {
    default: { writeFileSync: writeFileSyncMock, mkdirSync: mkdirSyncMock },
    writeFileSync: writeFileSyncMock,
    mkdirSync: mkdirSyncMock,
  };
});

let backupDb;

beforeEach(async () => {
  ({ backupDb } = await import('../scripts/backup_db.js'));
  fromMock.mockClear();
  selectMock.mockClear();
  writeFileSync.mockClear();
});

test('backupDb fetches tables and writes file', async () => {
  const result = await backupDb('out.json');
  const tables = [
    'produits',
    'fournisseurs',
    'factures',
    'facture_lignes',
    'inventaires',
    'inventaire_lignes',
    'fournisseur_produits',
    'taches',
    'tache_instances',
  ];
  for (const table of tables) {
    expect(fromMock).toHaveBeenCalledWith(table);
  }
  expect(writeFileSync).toHaveBeenCalledWith('out.json', expect.any(String));
  expect(result).toBe('out.json');
});

test('backupDb supports generic env vars', async () => {
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://generic.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'gen';
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  await backupDb('out.json');
  expect(createClientMock).toHaveBeenCalledWith('https://generic.supabase.co', 'gen');
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'key';
  vi.resetModules();
});

test('backupDb returns default name when output not provided', async () => {
  const result = await backupDb();
  expect(result).toMatch(/backup_\d{8}\.json/);
});

test('backupDb writes to BACKUP_DIR when set', async () => {
  process.env.BACKUP_DIR = '/tmp';
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  const result = await backupDb();
  expect(result).toMatch(/^\/tmp\/backup_\d{8}\.json$/);
  delete process.env.BACKUP_DIR;
});

test('backupDb creates BACKUP_DIR if missing', async () => {
  process.env.BACKUP_DIR = '/tmp/backups';
  vi.resetModules();
  const { mkdirSync } = await import('fs');
  ({ backupDb } = await import('../scripts/backup_db.js'));
  await backupDb();
  expect(mkdirSync).toHaveBeenCalledWith('/tmp/backups', { recursive: true });
  delete process.env.BACKUP_DIR;
});

test('backupDb uses provided mamaId', async () => {
  await backupDb('out.json', 'm1');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
});

test('backupDb accepts explicit credentials', async () => {
  await backupDb('out.json', null, 'https://cli.supabase.co', 'cli');
  expect(createClientMock).toHaveBeenCalledWith('https://cli.supabase.co', 'cli');
});

test('backupDb supports custom table list', async () => {
  await backupDb('out.json', null, null, null, ['produits', 'fournisseurs']);
  expect(fromMock).toHaveBeenCalledWith('produits');
  expect(fromMock).toHaveBeenCalledWith('fournisseurs');
  expect(fromMock).not.toHaveBeenCalledWith('factures');
});

test('backupDb reads BACKUP_TABLES env variable', async () => {
  process.env.BACKUP_TABLES = 'a,b';
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  await backupDb('out.json');
  expect(fromMock).toHaveBeenCalledWith('a');
  expect(fromMock).toHaveBeenCalledWith('b');
  expect(fromMock).not.toHaveBeenCalledWith('produits');
  delete process.env.BACKUP_TABLES;
});

test('parses --mama-id via runScript', async () => {
  vi.resetModules();
  vi.doMock('../scripts/cli_utils.js', async () => {
    const actual = await vi.importActual('../scripts/cli_utils.js');
    return { ...actual, runScript: vi.fn(), isMainModule: () => true };
  });
  await import('../scripts/backup_db.js');
  const { runScript } = await import('../scripts/cli_utils.js');
  const parse = runScript.mock.calls[0][2];
  const result = parse(['--mama-id', 'm3']);
  expect(result).toEqual([undefined, 'm3', undefined, undefined, undefined, false, false, undefined]);
  vi.doUnmock('../scripts/cli_utils.js');
});

test('parses --url and --key via runScript', async () => {
  vi.resetModules();
  vi.doMock('../scripts/cli_utils.js', async () => {
    const actual = await vi.importActual('../scripts/cli_utils.js');
    return { ...actual, runScript: vi.fn(), isMainModule: () => true };
  });
  await import('../scripts/backup_db.js');
  const { runScript } = await import('../scripts/cli_utils.js');
  const parse = runScript.mock.calls[0][2];
  const result = parse(['--url', 'u', '--key', 'k']);
  expect(result).toEqual([undefined, undefined, 'u', 'k', undefined, false, false, undefined]);
  vi.doUnmock('../scripts/cli_utils.js');
});

test('parses --tables via runScript', async () => {
  vi.resetModules();
  vi.doMock('../scripts/cli_utils.js', async () => {
    const actual = await vi.importActual('../scripts/cli_utils.js');
    return { ...actual, runScript: vi.fn(), isMainModule: () => true };
  });
  await import('../scripts/backup_db.js');
  const { runScript } = await import('../scripts/cli_utils.js');
  const parse = runScript.mock.calls[0][2];
  const result = parse(['--tables', 'a,b']);
  expect(result).toEqual([undefined, undefined, undefined, undefined, ['a', 'b'], false, false, undefined]);
  vi.doUnmock('../scripts/cli_utils.js');
});

test('parses --gzip via runScript', async () => {
  vi.resetModules();
  vi.doMock('../scripts/cli_utils.js', async () => {
    const actual = await vi.importActual('../scripts/cli_utils.js');
    return { ...actual, runScript: vi.fn(), isMainModule: () => true };
  });
  await import('../scripts/backup_db.js');
  const { runScript } = await import('../scripts/cli_utils.js');
  const parse = runScript.mock.calls[0][2];
  const result = parse(['--gzip']);
  expect(result).toEqual([undefined, undefined, undefined, undefined, undefined, true, false, undefined]);
  vi.doUnmock('../scripts/cli_utils.js');
});

test('parses --pretty via runScript', async () => {
  vi.resetModules();
  vi.doMock('../scripts/cli_utils.js', async () => {
    const actual = await vi.importActual('../scripts/cli_utils.js');
    return { ...actual, runScript: vi.fn(), isMainModule: () => true };
  });
  await import('../scripts/backup_db.js');
  const { runScript } = await import('../scripts/cli_utils.js');
  const parse = runScript.mock.calls[0][2];
  const result = parse(['--pretty']);
  expect(result).toEqual([undefined, undefined, undefined, undefined, undefined, false, true, undefined]);
  vi.doUnmock('../scripts/cli_utils.js');
});

test('parses --concurrency via runScript', async () => {
  vi.resetModules();
  vi.doMock('../scripts/cli_utils.js', async () => {
    const actual = await vi.importActual('../scripts/cli_utils.js');
    return { ...actual, runScript: vi.fn(), isMainModule: () => true };
  });
  await import('../scripts/backup_db.js');
  const { runScript } = await import('../scripts/cli_utils.js');
  const parse = runScript.mock.calls[0][2];
  const result = parse(['--concurrency', '2']);
  expect(result).toEqual([undefined, undefined, undefined, undefined, undefined, false, false, 2]);
  vi.doUnmock('../scripts/cli_utils.js');
});

test('backupDb gzips output when option enabled', async () => {
  vi.mock('zlib', () => ({ gzipSync: () => Buffer.from('zip') }));
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  await backupDb('out.json.gz', null, null, null, null, true);
  const args = writeFileSync.mock.calls[0];
  expect(args[0]).toBe('out.json.gz');
  expect(Buffer.isBuffer(args[1])).toBe(true);
  vi.unmock('zlib');
});

test('backupDb pretty prints when enabled', async () => {
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  eqMock.mockReturnValueOnce({ data: [{ id: 1 }], error: null });
  await backupDb('out.json', 'm1', null, null, ['prod'], false, true);
  const [, data] = writeFileSync.mock.calls[0];
  expect(data).toContain('\n');
});

test('reads BACKUP_GZIP env variable', async () => {
  process.env.BACKUP_GZIP = 'true';
  vi.mock('zlib', () => ({ gzipSync: () => Buffer.from('zip') }));
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  const result = await backupDb();
  expect(result).toMatch(/backup_\d{8}\.json\.gz/);
  const args = writeFileSync.mock.calls[0];
  expect(Buffer.isBuffer(args[1])).toBe(true);
  delete process.env.BACKUP_GZIP;
  vi.unmock('zlib');
});

test('reads BACKUP_PRETTY env variable', async () => {
  process.env.BACKUP_PRETTY = 'true';
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  eqMock.mockReturnValueOnce({ data: [{ id: 1 }], error: null });
  await backupDb('out.json', 'm1', null, null, ['prod']);
  const [, data] = writeFileSync.mock.calls[0];
  expect(data).toContain('\n');
  delete process.env.BACKUP_PRETTY;
});

test('reads BACKUP_CONCURRENCY env variable', async () => {
  process.env.BACKUP_CONCURRENCY = '1';
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  await backupDb('out.json');
  expect(fromMock).toHaveBeenCalledTimes(10); // all tables sequentially
  delete process.env.BACKUP_CONCURRENCY;
});

test('ignores invalid BACKUP_CONCURRENCY values', async () => {
  process.env.BACKUP_CONCURRENCY = 'bad';
  const spy = vi.spyOn(Promise, 'all');
  vi.resetModules();
  ({ backupDb } = await import('../scripts/backup_db.js'));
  await backupDb('out.json');
  expect(spy).toHaveBeenCalledTimes(1); // one batch for Infinity
  spy.mockRestore();
  delete process.env.BACKUP_CONCURRENCY;
});
