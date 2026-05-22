import { Client, Databases, DatabasesIndexType, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID ?? '')
  .setKey(process.env.APPWRITE_API_KEY ?? '');

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? '';
const COLLECTION_ID = 'members';

async function run() {
  console.log('Creating members collection...');

  await databases.createCollection(DATABASE_ID, COLLECTION_ID, 'members', [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ]);
  console.log('Collection created.');

  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'shopId', 255, true);
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'email', 255, true);
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'name', 255, false, '');
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'userId', 255, false);
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'role', 50, false, 'seller');
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'inviteCode', 100, true);
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'status', 50, false, 'pending');
  console.log('Attributes created. Waiting for attributes to be ready...');

  // Appwrite requires attributes to be active before creating indexes
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_shopId', DatabasesIndexType.Key, ['shopId']);
  await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_userId', DatabasesIndexType.Key, ['userId']);
  await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_status', DatabasesIndexType.Key, ['status']);
  await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_inviteCode', DatabasesIndexType.Key, ['inviteCode']);
  console.log('Indexes created.');

  console.log('Done. members collection is ready.');
}

run().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
