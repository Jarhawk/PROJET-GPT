import { vi, test, expect, beforeEach } from 'vitest';
import { writeFileSync } from 'fs';

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

const selectMock = vi.fn(() => ({ eq: vi.fn(() => ({ data: [], error: null })) }));
const fromMock = vi.fn(() => ({ select: selectMock }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ from: fromMock })) }));
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
    'products',
    'fournisseurs',
    'factures',
    'facture_lignes',
    'inventaires',
    'inventaire_lignes',
    'supplier_products',
    'taches',
    'tache_instances',
    'mouvements_stock',
  ];
  for (const table of tables) {
    expect(fromMock).toHaveBeenCalledWith(table);
  }
  expect(writeFileSync).toHaveBeenCalledWith('out.json', expect.any(String));
});
