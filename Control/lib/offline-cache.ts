import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = `${FileSystem.documentDirectory}ctrl-cache/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export async function cacheWrite(key: string, data: unknown): Promise<void> {
  try {
    await ensureDir();
    await FileSystem.writeAsStringAsync(`${CACHE_DIR}${key}.json`, JSON.stringify(data));
  } catch {
    // cache write failure is non-fatal
  }
}

export async function cacheRead<T>(key: string): Promise<T | null> {
  try {
    const path = `${CACHE_DIR}${key}.json`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
