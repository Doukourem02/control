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

// One-off : cree une Organization pour chaque shop existant qui n'en a pas
// encore, et lie le shop dessus. Idempotent — relancable sans risque.
async function listShopsMissingOrganization() {
  const shops = [];
  let cursor;

  for (;;) {
    const queries = [sdk.Query.limit(100)];
    if (cursor) queries.push(sdk.Query.cursorAfter(cursor));

    const page = await databases.listDocuments({ databaseId, collectionId: 'shops', queries });
    shops.push(...page.documents);

    if (page.documents.length < 100) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }

  return shops.filter((shop) => !shop.organizationId);
}

async function findOrganizationByOwner(ownerUserId) {
  const response = await databases.listDocuments({
    databaseId,
    collectionId: 'organizations',
    queries: [sdk.Query.equal('ownerUserId', ownerUserId), sdk.Query.limit(1)],
  });

  return response.documents[0] ?? null;
}

async function createOrganizationForShop(shop) {
  const name = shop.name && shop.name.trim() ? `Entreprise ${shop.name.trim()}` : 'Mon entreprise';

  return databases.createDocument({
    databaseId,
    collectionId: 'organizations',
    documentId: sdk.ID.unique(),
    data: { ownerUserId: shop.ownerUserId, name },
  });
}

async function main() {
  const shops = await listShopsMissingOrganization();
  console.log(`${shops.length} boutique(s) sans organizationId.`);

  for (const shop of shops) {
    let organization = await findOrganizationByOwner(shop.ownerUserId);

    if (!organization) {
      organization = await createOrganizationForShop(shop);
      console.log(`organization created for owner ${shop.ownerUserId}: ${organization.$id}`);
    }

    await databases.updateDocument({
      databaseId,
      collectionId: 'shops',
      documentId: shop.$id,
      data: { organizationId: organization.$id },
    });
    console.log(`shop ${shop.$id} -> organization ${organization.$id}`);
  }

  console.log('Backfill termine.');
}

main().catch((error) => {
  console.error(error.code || '', error.message);
  process.exit(1);
});
