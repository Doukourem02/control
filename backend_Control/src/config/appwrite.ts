import { Client, Databases } from 'node-appwrite';
import { env } from './env';

const client = new Client()
  .setEndpoint(env.appwriteEndpoint)
  .setProject(env.appwriteProjectId)
  .setKey(env.appwriteApiKey);

export const databases = new Databases(client);

export const DATABASE_ID = env.appwriteDatabaseId;

export const COLLECTIONS = {
  products: 'products',
  stockMovements: 'stock_movements',
  sales: 'sales',
  expenses: 'expenses',
  cashClosures: 'cash_closures',
  missings: 'missings',
  activityLogs: 'activity_logs',
  categories: 'categories',
} as const;
