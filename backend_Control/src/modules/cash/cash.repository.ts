import { createId, nowIso, readStore, updateStore } from '../../database/control-store';
import { isToday } from '../../utils/dates';

export type CreateCashClosureInput = {
  shopId: string;
  expectedCashAmount: number;
  physicalCashAmount: number;
  cashGap: number;
  note: string;
};

export async function createCashClosureRecord(input: CreateCashClosureInput) {
  return updateStore((store) => {
    const timestamp = nowIso();
    const closure = {
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      expectedCashAmount: input.expectedCashAmount,
      physicalCashAmount: input.physicalCashAmount,
      cashGap: input.cashGap,
      note: input.note,
    };

    store.cashClosures.push(closure);
    store.activityLogs.push({
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      type: 'cash',
      actorName: 'Vendeuse',
      message: `Cloture caisse : ecart ${input.cashGap} F`,
    });

    return closure;
  });
}

export async function listTodayCashClosuresByShop(shopId: string) {
  const store = await readStore();

  return store.cashClosures
    .filter((closure) => closure.shopId === shopId && isToday(closure.$createdAt))
    .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
}
