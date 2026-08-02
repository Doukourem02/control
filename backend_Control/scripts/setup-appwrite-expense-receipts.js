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
const collectionId = 'expenses';
// Bucket partage avec les logos boutique (le plan Appwrite limite le nombre
// de buckets — voir scripts/setup-appwrite-shop-logos.js pour sa creation).
const bucketId = 'shop_logos';

async function checkSharedBucket() {
  try {
    await storage.getBucket({ bucketId });
    console.log('bucket shop_logos (partage): exists');
  } catch (error) {
    if (error.code !== 404) throw error;
    console.error(
      "bucket shop_logos introuvable — lance d'abord node scripts/setup-appwrite-shop-logos.js"
    );
    process.exit(1);
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

async function ensureReceiptAttribute() {
  if (await attributeExists('receiptFileId')) {
    console.log('attribute receiptFileId: exists');
    return;
  }

  await databases.createStringAttribute({
    databaseId,
    collectionId,
    key: 'receiptFileId',
    size: 64,
    required: false,
    xdefault: '',
  });
  console.log('attribute receiptFileId: created');
}

async function main() {
  await checkSharedBucket();
  await ensureReceiptAttribute();
}

main().catch((error) => {
  console.error(error.code || '', error.message);
  process.exit(1);
});
