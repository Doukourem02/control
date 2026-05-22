import * as FileSystem from 'expo-file-system/legacy';

type SalePayload = {
  productId: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Mobile Money';
};

type ExpensePayload = {
  category: string;
  amount: number;
  note?: string;
};

export type QueuedAction =
  | { id: string; type: 'sale'; payload: SalePayload; queuedAt: number }
  | { id: string; type: 'expense'; payload: ExpensePayload; queuedAt: number };

const QUEUE_PATH = `${FileSystem.documentDirectory}ctrl-queue.json`;

async function readQueue(): Promise<QueuedAction[]> {
  try {
    const info = await FileSystem.getInfoAsync(QUEUE_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(QUEUE_PATH);
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedAction[]): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(QUEUE_PATH, JSON.stringify(queue));
  } catch {
    // non-fatal
  }
}

export async function queueAdd(action: Omit<QueuedAction, 'id' | 'queuedAt'>): Promise<string> {
  const queue = await readQueue();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item = { ...action, id, queuedAt: Date.now() } as QueuedAction;
  await writeQueue([...queue, item]);
  return id;
}

export async function queueGet(): Promise<QueuedAction[]> {
  return readQueue();
}

export async function queueRemove(id: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function queueCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}
