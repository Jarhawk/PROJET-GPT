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
  return {
    default: { writeFileSync: writeFileSyncMock },
    writeFileSync: writeFileSyncMock,
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
  await backupDb('out.json');
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
    'mouvements_stock',
  ];
  for (const table of tables) {
    expect(fromMock).toHaveBeenCalledWith(table);
  }
  expect(writeFileSync).toHaveBeenCalledWith('out.json', expect.any(String));
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

test('backupDb uses provided mamaId', async () => {
  await backupDb('out.json', 'm1');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
});

test('backupDb accepts explicit credentials', async () => {
  await backupDb('out.json', null, 'https://cli.supabase.co', 'cli');
  expect(createClientMock).toHaveBeenCalledWith('https://cli.supabase.co', 'cli');
});
