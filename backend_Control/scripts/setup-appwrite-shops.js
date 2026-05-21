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

const attributes = [
  { key: 'ownerUserId', size: 64, required: true },
  { key: 'ownerName', size: 99, required: true },
  { key: 'name', size: 128, required: true },
  { key: 'currency', size: 16, required: true },
  { key: 'contact', size: 128, required: false },
  { key: 'address', size: 256, required: false },
  { key: 'openingHours', size: 128, required: false },
  { key: 'paymentMethods', size: 64, required: false },
  { key: 'defaultClosingTime', size: 8, required: false },
  { key: 'amountsVisibleByDefault', size: 8, required: false },
  { key: 'displayLanguage', size: 8, required: false },
  { key: 'defaultUnit', size: 16, required: false },
  { key: 'stockLowAlertsEnabled', size: 8, required: false },
  { key: 'closureReminderEnabled', size: 8, required: false },
  { key: 'cashGapAlertsEnabled', size: 8, required: false },
  { key: 'defaultLowStockThreshold', size: 8, required: false },
];

async function ensureCollection() {
  try {
    await databases.getCollection({ databaseId, collectionId });
    console.log('shops collection: exists');
  } catch (error) {
    if (error.code !== 404) throw error;

    await databases.createCollection({
      databaseId,
      collectionId,
      name: 'Shops',
      permissions: [],
      documentSecurity: false,
      enabled: true,
    });
    console.log('shops collection: created');
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
  for (const attribute of attributes) {
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
      xdefault: attribute.required ? undefined : '',
    });
    console.log(`attribute ${attribute.key}: created`);
  }
}

async function main() {
  await ensureCollection();
  await ensureAttributes();
}

main().catch((error) => {
  console.error(error.code || '', error.message);
  process.exit(1);
});
