import fs from 'node:fs/promises';
import path from 'node:path';

export const storageRoot = '/tmp/lumnipsi-uploads';
export const storagePublicPrefix = '/storage';

export async function ensureStorageRoot() {
  await fs.mkdir(storageRoot, { recursive: true });
}

export function buildStorageKey(fileName: string) {
  return path.posix.join(storagePublicPrefix, fileName);
}

export function resolveStoragePath(fileName: string) {
  return path.join(storageRoot, fileName);
}
