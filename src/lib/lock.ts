import fs from 'fs';
import path from 'path';
import { getConfig } from './config';

const TTL = 20_000;
const HEARTBEAT = 5_000;
let lockTimer: NodeJS.Timeout | null = null;
let lockId = `${process.pid}-${Date.now()}`;

function lockFile(dir: string) {
  return path.join(dir, 'db.lock.json');
}

export async function ensureSingleOwner() {
  const { dataDir } = getConfig();
  const file = lockFile(dataDir);
  fs.mkdirSync(dataDir, { recursive: true });
  while (true) {
    const now = Date.now();
    try {
      if (fs.existsSync(file)) {
        const info = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (info.expiresAt && info.expiresAt > now) {
          // ask current owner to shutdown
          fs.writeFileSync(path.join(dataDir, 'shutdown.request.json'), JSON.stringify({ requestedAt: now }));
          await new Promise((r) => setTimeout(r, HEARTBEAT));
          continue;
        }
      }
      fs.writeFileSync(file, JSON.stringify({ owner: lockId, expiresAt: now + TTL }));
      lockTimer = setInterval(() => {
        fs.writeFileSync(file, JSON.stringify({ owner: lockId, expiresAt: Date.now() + TTL }));
      }, HEARTBEAT);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, HEARTBEAT));
    }
  }
}

export function releaseLock() {
  const { dataDir } = getConfig();
  const file = lockFile(dataDir);
  if (lockTimer) clearInterval(lockTimer);
  lockTimer = null;
  try {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {
    // ignore
  }
}
