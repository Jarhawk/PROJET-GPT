import fs from 'fs';
import os from 'os';
import path from 'path';
import { getConfig, defaultDataDir } from './config';
import { closeDb, getDb } from './db';

function isTauri() {
  // @ts-ignore
  return typeof window !== 'undefined' && !!window.__TAURI__;
}

export async function backupDb(dataDir?: string, targetDir?: string) {
  const { documentDir, join } = await (isTauri()
    ? import('@tauri-apps/api/path')
    : Promise.resolve({
        documentDir: async () => path.join(os.homedir(), 'Documents'),
        join: async (...args: string[]) => path.join(...args),
      }));
  const fsApi = await (isTauri()
    ? import('@tauri-apps/plugin-fs')
    : Promise.resolve({
        readBinaryFile: async (p: string) => fs.readFileSync(p),
        writeBinaryFile: async (p: string, d: Uint8Array | Buffer) => fs.writeFileSync(p, d),
        createDir: async (p: string) => fs.mkdirSync(p, { recursive: true }),
      }));

  const dir = dataDir || getConfig().dataDir || defaultDataDir;
  const dbFile = path.join(dir, 'mamastock.db');
  const docs = targetDir || await documentDir();
  const backupDir = await join(docs, 'MamaStock', 'Backups');
  await fsApi.createDir(backupDir);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = await join(backupDir, `mamastock-${ts}.db`);
  const data = await fsApi.readBinaryFile(dbFile);
  await fsApi.writeBinaryFile(dest, data);
  return dest;
}

export async function restoreDb(srcPath?: string, dataDir?: string) {
  const { join } = await (isTauri()
    ? import('@tauri-apps/api/path')
    : Promise.resolve({ join: async (...args: string[]) => path.join(...args) }));
  const fsApi = await (isTauri()
    ? import('@tauri-apps/plugin-fs')
    : Promise.resolve({
        readBinaryFile: async (p: string) => fs.readFileSync(p),
        writeBinaryFile: async (p: string, d: Uint8Array | Buffer) => fs.writeFileSync(p, d),
      }));
  const dialog = await (isTauri()
    ? import('@tauri-apps/plugin-dialog')
    : Promise.resolve({ open: async () => null }));
  let file = srcPath;
  if (!file) {
    const selected = await dialog.open({ multiple: false, filters: [{ name: 'SQLite', extensions: ['db'] }] });
    if (!selected) return false;
    file = Array.isArray(selected) ? selected[0] : selected;
  }
  const dir = dataDir || getConfig().dataDir || defaultDataDir;
  const dest = await join(dir, 'mamastock.db');
  await closeDb();
  const data = await fsApi.readBinaryFile(file as string);
  await fsApi.writeBinaryFile(dest, data);
  return true;
}

export async function maintenanceDb() {
  const db = getDb();
  db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  db.exec('VACUUM;');
}
