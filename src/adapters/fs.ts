import {
  readTextFile,
  writeTextFile,
  readFile,
  writeFile,
  exists,
  mkdir,
  remove,
} from '@tauri-apps/plugin-fs';

export const readText = readTextFile;
export { writeFile, exists };

export async function createDir(path: string) {
  await mkdir(path, { recursive: true });
}

export async function writeText(path: string, data: string) {
  await writeTextFile(path, data);
}

export async function readBinary(path: string) {
  return readFile(path);
}

export async function writeBinary(path: string, data: Uint8Array) {
  await writeFile(path, data);
}

export async function pathExists(path: string) {
  return exists(path);
}

export async function ensureDir(path: string) {
  if (!(await exists(path))) {
    await createDir(path);
  }
}

export async function removeFile(path: string) {
  try {
    await remove(path);
  } catch {
    // ignore
  }
}
