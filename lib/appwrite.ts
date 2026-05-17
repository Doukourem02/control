import 'react-native-url-polyfill/auto';

import { Client, TablesDB } from 'react-native-appwrite';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  console.warn('Missing Appwrite env variables. Check Control/.env.');
}

export const APPWRITE_DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? 'control';

export const APPWRITE_TABLES = {
  shops: 'shops',
  products: 'products',
  stockMovements: 'stock_movements',
  sales: 'sales',
  expenses: 'expenses',
  missings: 'missings',
  cashClosures: 'cash_closures',
  activityLogs: 'activity_logs',
} as const;

export const client = new Client()
  .setEndpoint(endpoint ?? '')
  .setProject(projectId ?? '')
  .setPlatform('com.doukourem02.control');

export const tablesDb = new TablesDB(client);
