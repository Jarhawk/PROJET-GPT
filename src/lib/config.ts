import fs from 'fs';
import os from 'os';
import path from 'path';

const APP_NAME = 'MamaStock';
const configDir = process.env.APPDATA || path.join(os.homedir(), '.config');
export const configPath = path.join(configDir, APP_NAME, 'config.json');
export const defaultDataDir = path.join(os.homedir(), APP_NAME, 'data');
export const defaultExportDir = path.join(
  os.homedir(),
  'Documents',
  APP_NAME,
  'Exports'
);

export function getConfig() {
  try {
    const txt = fs.readFileSync(configPath, 'utf-8');
    const cfg = JSON.parse(txt);
    return {
      dataDir: cfg.dataDir || defaultDataDir,
      exportDir: cfg.exportDir || defaultExportDir,
    };
  } catch {
    return { dataDir: defaultDataDir, exportDir: defaultExportDir };
  }
}

export function saveConfig(cfg: { dataDir?: string; exportDir?: string }) {
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });
  const current = getConfig();
  const next = { ...current, ...cfg };
  fs.writeFileSync(configPath, JSON.stringify(next, null, 2));
}
