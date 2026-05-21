import { Account, Client, Databases, Users } from 'node-appwrite';
import { env } from './env';

const client = new Client()
  .setEndpoint(env.appwriteEndpoint)
  .setProject(env.appwriteProjectId)
  .setKey(env.appwriteApiKey);

export const databases = new Databases(client);
export const users = new Users(client);
export const adminAccount = new Account(client);

export function createSessionAccount(sessionSecret: string) {
  const sessionClient = new Client()
    .setEndpoint(env.appwriteEndpoint)
    .setProject(env.appwriteProjectId)
    .setSession(sessionSecret);

  return new Account(sessionClient);
}

export const DATABASE_ID = env.appwriteDatabaseId;

export const COLLECTIONS = {
  shops: 'shops',
  products: 'products',
  stockMovements: 'stock_movements',
  sales: 'sales',
  expenses: 'expenses',
  cashClosures: 'cash_closures',
  missings: 'missings',
  activityLogs: 'activity_logs',
  categories: 'categories',
  notifications: 'notifications',
  members: 'members',
} as const;
