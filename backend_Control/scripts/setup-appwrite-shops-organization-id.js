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
const collectionId = 'shops';

async function attributeExists(key) {
  try {
    await databases.getAttribute({ databaseId, collectionId, key });
    return true;
  } catch (error) {
    if (error.code === 404) return false;
    throw error;
  }
}

async function ensureOrganizationIdAttribute() {
  if (await attributeExists('organizationId')) {
    console.log('attribute organizationId: exists');
    return;
  }

  await databases.createStringAttribute({
    databaseId,
    collectionId,
    key: 'organizationId',
    size: 64,
    required: false,
    xdefault: '',
  });
  console.log('attribute organizationId: created');
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

async function ensureOrganizationIdIndex() {
  if (await indexExists('organizationId')) {
    console.log('index organizationId: exists');
    return;
  }

  await databases.createIndex({
    databaseId,
    collectionId,
    key: 'organizationId',
    type: 'key',
    attributes: ['organizationId'],
    orders: ['ASC'],
  });
  console.log('index organizationId: created');
}

async function main() {
  await ensureOrganizationIdAttribute();
  // Laisse l'attribut se stabiliser avant de creer l'index dessus
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await ensureOrganizationIdIndex();
}

main().catch((error) => {
  console.error(error.code || '', error.message);
  process.exit(1);
});
