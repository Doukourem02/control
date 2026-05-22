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
const collectionId = 'cash_closures';

async function attributeExists(key) {
  try {
    await databases.getAttribute({ databaseId, collectionId, key });
    return true;
  } catch (error) {
    if (error.code === 404) return false;
    throw error;
  }
}

async function main() {
  if (!(await attributeExists('correctionNote'))) {
    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: 'correctionNote',
      size: 512,
      required: false,
    });
    console.log('attribute correctionNote: created');
  } else {
    console.log('attribute correctionNote: exists');
  }

  if (!(await attributeExists('isPartial'))) {
    await databases.createBooleanAttribute({
      databaseId,
      collectionId,
      key: 'isPartial',
      required: false,
      xdefault: false,
    });
    console.log('attribute isPartial: created');
  } else {
    console.log('attribute isPartial: exists');
  }
}

main().catch((error) => {
  console.error(error.code || '', error.message);
  process.exit(1);
});
