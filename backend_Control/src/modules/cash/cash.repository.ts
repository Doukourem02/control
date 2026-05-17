import { readStore } from '../../database/control-store';
import { isToday } from '../../utils/dates';

export async function listTodayCashClosuresByShop(shopId: string) {
  const store = await readStore();

  return store.cashClosures
    .filter((closure) => closure.shopId === shopId && isToday(closure.$createdAt))
    .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
}
