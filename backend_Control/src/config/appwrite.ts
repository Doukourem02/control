import { Account, Client, Databases, Storage, Users } from 'node-appwrite';
import { env } from './env';

const client = new Client()
  .setEndpoint(env.appwriteEndpoint)
  .setProject(env.appwriteProjectId)
  .setKey(env.appwriteApiKey);

export const databases = new Databases(client);
export const users = new Users(client);
export const adminAccount = new Account(client);
export const storage = new Storage(client);

// Un seul bucket Storage partage entre logos boutique et recus de depenses
// (meme modele de securite : prive, jamais d'URL publique, servi uniquement
// via un proxy backend authentifie). Le plan Appwrite limite le nombre de
// buckets ; inutile d'en payer/creer un deuxieme pour un besoin identique.
export const BUCKETS = {
  photos: 'shop_logos',
} as const;

export function createSessionAccount(sessionSecret: string) {
  const sessionClient = new Client()
    .setEndpoint(env.appwriteEndpoint)
    .setProject(env.appwriteProjectId)
    .setSession(sessionSecret);

  return new Account(sessionClient);
}

export const DATABASE_ID = env.appwriteDatabaseId;

export const COLLECTIONS = {
  userProfiles: 'user_profiles',
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
  organizations: 'organizations',
} as const;
