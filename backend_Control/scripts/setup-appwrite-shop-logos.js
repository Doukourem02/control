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
const storage = new sdk.Storage(client);
const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId = 'shops';
const bucketId = 'shop_logos';

async function ensureBucket() {
  try {
    await storage.getBucket({ bucketId });
    console.log('bucket shop_logos: exists');
  } catch (error) {
    if (error.code !== 404) throw error;

    // Prive : servi uniquement via le backend (GET /api/shops/current/logo),
    // jamais par une URL Appwrite directe.
    await storage.createBucket({
      bucketId,
      name: 'Shop logos',
      permissions: [],
      fileSecurity: false,
      enabled: true,
      maximumFileSize: 4 * 1024 * 1024,
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    });
    console.log('bucket shop_logos: created');
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

async function ensureLogoAttribute() {
  if (await attributeExists('logoFileId')) {
    console.log('attribute logoFileId: exists');
    return;
  }

  await databases.createStringAttribute({
    databaseId,
    collectionId,
    key: 'logoFileId',
    size: 64,
    required: false,
    xdefault: '',
  });
  console.log('attribute logoFileId: created');
}

async function main() {
  await ensureBucket();
  await ensureLogoAttribute();
}

main().catch((error) => {
  console.error(error.code || '', error.message);
  process.exit(1);
});
