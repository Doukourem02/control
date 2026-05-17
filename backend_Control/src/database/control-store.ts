import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

import type { ControlStore } from '../types/control';

const storePath =
  process.env.CONTROL_STORE_PATH ?? path.join(process.cwd(), 'storage', 'control-store.json');

function createEmptyStore(): ControlStore {
  return {
    products: [],
    stockMovements: [],
    sales: [],
    expenses: [],
    cashClosures: [],
    missings: [],
    activityLogs: [],
  };
}

let writeQueue = Promise.resolve();

async function ensureStoreDirectory() {
  await mkdir(path.dirname(storePath), { recursive: true });
}

export function nowIso() {
  return new Date().toISOString();
}

export function createId() {
  return randomUUID();
}

export async function readStore(): Promise<ControlStore> {
  try {
    const rawStore = await readFile(storePath, 'utf8');
    const parsedStore = JSON.parse(rawStore) as Partial<ControlStore>;

    return {
      products: parsedStore.products ?? [],
      stockMovements: parsedStore.stockMovements ?? [],
      sales: parsedStore.sales ?? [],
      expenses: parsedStore.expenses ?? [],
      cashClosures: parsedStore.cashClosures ?? [],
      missings: parsedStore.missings ?? [],
      activityLogs: parsedStore.activityLogs ?? [],
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return createEmptyStore();
    }

    throw error;
  }
}

export async function writeStore(store: ControlStore) {
  writeQueue = writeQueue.then(async () => {
    await ensureStoreDirectory();
    await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  });

  await writeQueue;
}

export async function updateStore<T>(updater: (store: ControlStore) => T | Promise<T>) {
  const store = await readStore();
  const result = await updater(store);
  await writeStore(store);

  return result;
}
