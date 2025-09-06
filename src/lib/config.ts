import fs from 'fs';
import os from 'os';
import path from 'path';

const APP_NAME = 'MamaStock';
const configDir = process.env.APPDATA || path.join(os.homedir(), '.config');
export const configPath = path.join(configDir, APP_NAME, 'config.json');
export const defaultDataDir = path.join(os.homedir(), APP_NAME, 'data');

export function getConfig() {
  try {
    const txt = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(txt);
  } catch {
    return { dataDir: defaultDataDir };
  }
}

export function saveConfig(cfg: { dataDir: string }) {
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}
