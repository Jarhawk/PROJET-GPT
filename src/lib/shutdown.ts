import fs from 'fs';
import path from 'path';
import { getConfig } from './config';
import { releaseLock } from './lock';
import { closeDb } from './db';

const HEARTBEAT = 5_000;
let monitorTimer: NodeJS.Timeout | null = null;

function requestFile(dir: string) {
  return path.join(dir, 'shutdown.request.json');
}

export function monitorShutdownRequests(onExit?: () => void) {
  const { dataDir } = getConfig();
  const file = requestFile(dataDir);
  monitorTimer = setInterval(async () => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch {}
      await shutdownDbSafely();
      releaseLock();
      if (onExit) onExit();
      if (typeof window !== 'undefined') window.close();
    }
  }, HEARTBEAT);
}

export async function shutdownDbSafely() {
  try {
    await closeDb();
  } catch {
    // ignore
  }
}
