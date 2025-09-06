import { backupDb, restoreDb } from '@/lib/fsHelpers';
import { getDb, closeDb } from '@/lib/db';
import { saveConfig } from '@/lib/config';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { test, expect } from 'vitest';

// Test backup then restore retains data

test('backup and restore roundtrip', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ms-'));
  saveConfig({ dataDir: tmp });
  const db = getDb();
  await db.query('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, name TEXT);');
  await db.query("INSERT INTO t (name) VALUES ('hello')");
  const backupPath = await backupDb(tmp, tmp);
  await db.query('DELETE FROM t;');
  await restoreDb(backupPath, tmp);
  const db2 = getDb();
  const res = await db2.query('SELECT name FROM t');
  const rows = res.rows || [];
  expect(rows.map((r) => r.name)).toContain('hello');
  await closeDb();
});
