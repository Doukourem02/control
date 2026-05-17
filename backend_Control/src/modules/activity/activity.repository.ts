import { readStore } from '../../database/control-store';

export async function listRecentActivityByShop(shopId: string, limit: number) {
  const store = await readStore();

  return store.activityLogs
    .filter((log) => log.shopId === shopId)
    .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
    .slice(0, limit);
}
