import { pathExists, removeFile } from '@/adapters/fs';
import { join } from '@/adapters/path';
import { getConfig } from './config';
import { releaseLock } from './lock';
import { closeDb } from './db';

const HEARTBEAT = 5_000;
let monitorTimer: ReturnType<typeof setInterval> | null = null;

async function requestFile(dir: string) {
  return join(dir, 'shutdown.request.json');
}

export async function monitorShutdownRequests(onExit?: () => void) {
  const { dataDir } = await getConfig();
  const file = await requestFile(dataDir);
  monitorTimer = setInterval(async () => {
    if (await pathExists(file)) {
      try {
        await removeFile(file);
      } catch {}
      await shutdownDbSafely();
      await releaseLock();
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
