require('dotenv').config({ path: './.env', quiet: true });

const sdk = require('node-appwrite');

const requiredEnv = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`${key} is missing.`);
    process.exit(1);
  }
}

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId = 'members';

const stringAttributes = [
  { key: 'shopId',     size: 64,  required: true },
  { key: 'email',      size: 256, required: true },
  { key: 'name',       size: 128, required: false },
  { key: 'userId',     size: 64,  required: false },
  { key: 'role',       size: 16,  required: true },
  { key: 'inviteCode', size: 32,  required: true },
  { key: 'status',     size: 16,  required: true },
];

const indexes = [
  { key: 'shopId_status', attributes: ['shopId', 'status'], orders: ['ASC', 'ASC'] },
  { key: 'userId',        attributes: ['userId'],            orders: ['ASC'] },
  { key: 'inviteCode',    attributes: ['inviteCode'],        orders: ['ASC'] },
];

async function ensureCollection() {
  try {
    await databases.getCollection({ databaseId, collectionId });
    console.log('members collection: exists');
  } catch (error) {
    if (error.code !== 404) throw error;

    await databases.createCollection({
      databaseId,
      collectionId,
      name: 'Members',
      permissions: [],
      documentSecurity: false,
      enabled: true,
    });
    console.log('members collection: created');
  }
}

async function attributeExists(key) {
  try {
    await databases.getAttribute({ databaseId, collectionId, key });
    return true;
  } catch (error) {
    if (error.code === 404) return false;
    throw error;
  }
}

async function ensureAttributes() {
  for (const attribute of stringAttributes) {
    if (await attributeExists(attribute.key)) {
      console.log(`attribute ${attribute.key}: exists`);
      continue;
    }

    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: attribute.key,
      size: attribute.size,
      required: attribute.required,
      xdefault: attribute.required ? undefined : null,
    });
    console.log(`attribute ${attribute.key}: created`);
  }
}

async function indexExists(key) {
  try {
    await databases.getIndex({ databaseId, collectionId, key });
    return true;
  } catch (error) {
    if (error.code === 404) return false;
    throw error;
  }
}

async function ensureIndexes() {
  for (const index of indexes) {
    if (await indexExists(index.key)) {
      console.log(`index ${index.key}: exists`);
      continue;
    }

    await databases.createIndex({
      databaseId,
      collectionId,
      key: index.key,
      type: 'key',
      attributes: index.attributes,
      orders: index.orders,
    });
    console.log(`index ${index.key}: created`);
  }
}

async function main() {
  await ensureCollection();
  // Wait for collection to be ready before adding attributes
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await ensureAttributes();
  await ensureIndexes();
}

main().catch((error) => {
  console.error(error.code || '', error.message);
  process.exit(1);
});
