import { pathExists, readText, writeText, ensureDir, removeFile } from '@/adapters/fs';
import { join } from '@/adapters/path';
import { getConfig } from './config';

const TTL = 20_000;
const HEARTBEAT = 5_000;
let lockTimer: ReturnType<typeof setInterval> | null = null;
let lockId = `${crypto.randomUUID()}-${Date.now()}`;

async function lockFile(dir: string) {
  return join(dir, 'db.lock.json');
}

export async function ensureSingleOwner() {
  const { dataDir } = await getConfig();
  const file = await lockFile(dataDir);
  await ensureDir(dataDir);
  while (true) {
    const now = Date.now();
    try {
      if (await pathExists(file)) {
        const info = JSON.parse(await readText(file));
        if (info.expiresAt && info.expiresAt > now) {
          await writeText(await join(dataDir, 'shutdown.request.json'), JSON.stringify({ requestedAt: now }));
          await new Promise((r) => setTimeout(r, HEARTBEAT));
          continue;
        }
      }
      await writeText(file, JSON.stringify({ owner: lockId, expiresAt: now + TTL }));
      lockTimer = setInterval(async () => {
        await writeText(file, JSON.stringify({ owner: lockId, expiresAt: Date.now() + TTL }));
      }, HEARTBEAT);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, HEARTBEAT));
    }
  }
}

export async function releaseLock() {
  const { dataDir } = await getConfig();
  const file = await lockFile(dataDir);
  if (lockTimer) clearInterval(lockTimer);
  lockTimer = null;
  try {
    if (await pathExists(file)) await removeFile(file);
  } catch {
    // ignore
  }
}
