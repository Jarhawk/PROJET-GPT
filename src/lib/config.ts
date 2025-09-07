import { join, dirname, homeDir, documentDir, appDataDir } from '@/adapters/path';
import { readText, writeText, ensureDir } from '@/adapters/fs';

const APP_NAME = 'MamaStock';

export async function configPath() {
  const dir = await appDataDir();
  return join(dir, APP_NAME, 'config.json');
}

export async function defaultDataDir() {
  const home = await homeDir();
  return join(home, APP_NAME, 'data');
}

export async function defaultExportDir() {
  const docs = await documentDir();
  return join(docs, APP_NAME, 'Exports');
}

export async function getConfig() {
  const [file, dataDir, exportDir] = await Promise.all([
    configPath(),
    defaultDataDir(),
    defaultExportDir(),
  ]);
  try {
    const txt = await readText(file);
    const cfg = JSON.parse(txt);
    return {
      dataDir: cfg.dataDir || dataDir,
      exportDir: cfg.exportDir || exportDir,
    };
  } catch {
    return { dataDir, exportDir };
  }
}

export async function saveConfig(cfg: { dataDir?: string; exportDir?: string }) {
  const file = await configPath();
  const dir = await dirname(file);
  await ensureDir(dir);
  const current = await getConfig();
  const next = { ...current, ...cfg };
  await writeText(file, JSON.stringify(next, null, 2));
}
