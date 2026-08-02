import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type OrganizationsService = typeof import('./organizations.service');
let ensureOrganizationForOwner: OrganizationsService['ensureOrganizationForOwner'];
let createStoreForOwner: OrganizationsService['createStoreForOwner'];
let switchActiveStore: OrganizationsService['switchActiveStore'];

let mockOrganizationByOwner: unknown = null;
let createOrganizationCalls = 0;
let mockShopById: unknown = null;
let updateUserProfileShopIdCalls: { userId: string; shopId: string }[] = [];

before(() => {
  const orgRepoPath = req.resolve('./organizations.repository');
  req.cache[orgRepoPath] = {
    exports: {
      getOrganizationByOwnerUserId: async () => mockOrganizationByOwner,
      createOrganization: async (ownerUserId: string, name: string) => {
        createOrganizationCalls += 1;
        return { $id: 'org-new', ownerUserId, name };
      },
      getOrganizationById: async () => mockOrganizationByOwner,
    },
  } as unknown as NodeJS.Module;

  const shopsRepoPath = req.resolve('../shops/shops.repository');
  req.cache[shopsRepoPath] = {
    exports: {
      getShopById: async () => mockShopById,
      createAdditionalShop: async (input: unknown) => ({ $id: 'shop-new', ...(input as object) }),
      listShopsByOrganization: async () => [],
    },
  } as unknown as NodeJS.Module;

  const usersRepoPath = req.resolve('../users/users.repository');
  req.cache[usersRepoPath] = {
    exports: {
      updateUserProfileShopId: async (userId: string, shopId: string) => {
        updateUserProfileShopIdCalls.push({ userId, shopId });
        return { userId, shopId };
      },
    },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('./organizations.service')];
  ({ ensureOrganizationForOwner, createStoreForOwner, switchActiveStore } = req('./organizations.service') as OrganizationsService);
});

describe('organizations.service – ensureOrganizationForOwner', () => {
  it('returns the existing organization without creating a new one', async () => {
    mockOrganizationByOwner = { $id: 'org-1', ownerUserId: 'owner-1', name: 'Entreprise Awa' };
    createOrganizationCalls = 0;

    const result = await ensureOrganizationForOwner('owner-1', 'Awa');

    assert.equal(result.$id, 'org-1');
    assert.equal(createOrganizationCalls, 0);
  });

  it('creates an organization when none exists yet', async () => {
    mockOrganizationByOwner = null;
    createOrganizationCalls = 0;

    const result = await ensureOrganizationForOwner('owner-2', 'Fatou');

    assert.equal(result.$id, 'org-new');
    assert.equal(createOrganizationCalls, 1);
  });
});

describe('organizations.service – createStoreForOwner', () => {
  before(() => {
    mockOrganizationByOwner = { $id: 'org-1', ownerUserId: 'owner-1', name: 'Entreprise Awa' };
  });

  it('rejects an empty store name', async () => {
    await assert.rejects(
      () => createStoreForOwner('owner-1', 'Awa', { name: '' }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'STORE_NAME_TOO_SHORT');
        return true;
      }
    );
  });

  it('rejects a store name that is too short', async () => {
    await assert.rejects(
      () => createStoreForOwner('owner-1', 'Awa', { name: 'A' }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'STORE_NAME_TOO_SHORT');
        return true;
      }
    );
  });

  it('creates a store under the owner organization', async () => {
    const result = await createStoreForOwner('owner-1', 'Awa', { name: 'Boutique Marcory' }) as { $id: string; name: string };
    assert.equal(result.$id, 'shop-new');
    assert.equal(result.name, 'Boutique Marcory');
  });
});

describe('organizations.service – switchActiveStore', () => {
  before(() => {
    updateUserProfileShopIdCalls = [];
  });

  it('throws ORG_STORE_NOT_FOUND when the store does not exist', async () => {
    mockShopById = null;

    await assert.rejects(
      () => switchActiveStore('owner-1', 'shop-missing'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'ORG_STORE_NOT_FOUND');
        return true;
      }
    );
  });

  it('throws ORG_STORE_FORBIDDEN when the store belongs to another owner', async () => {
    mockShopById = { $id: 'shop-2', ownerUserId: 'owner-2' };

    await assert.rejects(
      () => switchActiveStore('owner-1', 'shop-2'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'ORG_STORE_FORBIDDEN');
        return true;
      }
    );
  });

  it('updates the active store pointer when the store belongs to the owner', async () => {
    mockShopById = { $id: 'shop-1', ownerUserId: 'owner-1' };

    const result = await switchActiveStore('owner-1', 'shop-1') as { $id: string };

    assert.equal(result.$id, 'shop-1');
    assert.equal(updateUserProfileShopIdCalls.length, 1);
    assert.deepEqual(updateUserProfileShopIdCalls[0], { userId: 'owner-1', shopId: 'shop-1' });
  });
});
