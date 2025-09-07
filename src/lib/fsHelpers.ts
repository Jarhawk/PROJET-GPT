import { readBinary, writeBinary, ensureDir } from '@/adapters/fs';
import { join, documentDir } from '@/adapters/path';
import { getConfig, defaultDataDir } from './config';
import { closeDb } from './db';

export async function backupDb(dataDir?: string, targetDir?: string) {
  const dir = dataDir || (await getConfig()).dataDir || (await defaultDataDir());
  const dbFile = await join(dir, 'mamastock.db');
  const docs = targetDir || (await documentDir());
  const backupDir = await join(docs, 'MamaStock', 'Backups');
  await ensureDir(backupDir);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = await join(backupDir, `mamastock-${ts}.db`);
  const data = await readBinary(dbFile);
  await writeBinary(dest, data);
  return dest;
}

export async function restoreDb(srcPath?: string, dataDir?: string) {
  const { open } = await import('@tauri-apps/plugin-dialog');
  let file = srcPath;
  if (!file) {
    const selected = await open({ multiple: false, filters: [{ name: 'SQLite', extensions: ['db'] }] });
    if (!selected) return false;
    file = Array.isArray(selected) ? selected[0] : selected;
  }
  const dir = dataDir || (await getConfig()).dataDir || (await defaultDataDir());
  const dest = await join(dir, 'mamastock.db');
  await closeDb();
  const data = await readBinary(file as string);
  await writeBinary(dest, data);
  return true;
}

export async function maintenanceDb() {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('maintenance_db');
  } catch {}
}
