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
const collectionId = 'notifications';

const stringAttributes = [
  { key: 'shopId',  size: 64,  required: true },
  { key: 'type',    size: 32,  required: true },
  { key: 'title',   size: 128, required: true },
  { key: 'message', size: 512, required: true },
  { key: 'read',    size: 8,   required: false },
];

async function ensureCollection() {
  try {
    await databases.getCollection({ databaseId, collectionId });
    console.log('notifications collection: exists');
  } catch (error) {
    if (error.code !== 404) throw error;

    await databases.createCollection({
      databaseId,
      collectionId,
      name: 'Notifications',
      permissions: [],
      documentSecurity: false,
      enabled: true,
    });
    console.log('notifications collection: created');
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
      xdefault: attribute.required ? undefined : 'false',
    });
    console.log(`attribute ${attribute.key}: created`);
  }
}

async function ensureIndex() {
  try {
    await databases.getIndex({ databaseId, collectionId, key: 'shopId_createdAt' });
    console.log('index shopId_createdAt: exists');
  } catch (error) {
    if (error.code !== 404) throw error;

    await databases.createIndex({
      databaseId,
      collectionId,
      key: 'shopId_createdAt',
      type: 'key',
      attributes: ['shopId', '$createdAt'],
      orders: ['ASC', 'DESC'],
    });
    console.log('index shopId_createdAt: created');
  }
}

async function main() {
  await ensureCollection();
  await ensureAttributes();
  await ensureIndex();
}

main().catch((error) => {
  console.error(error.code || '', error.message);
  process.exit(1);
});
