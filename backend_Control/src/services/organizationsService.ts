import { AppwriteException, ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';
import { userError } from '../utils/http';
import { updateUserProfileShopId } from './usersService';
import {
  createAdditionalShop,
  getShopById,
  listShopsByOrganization,
  type ShopRow,
} from './shopsService';

export type OrganizationRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  ownerUserId: string;
  name: string;
};

function toOrganizationRow(doc: any): OrganizationRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    ownerUserId: doc.ownerUserId,
    name: doc.name,
  };
}

function isNotFound(error: unknown) {
  return error instanceof AppwriteException && error.code === 404;
}

export async function getOrganizationByOwnerUserId(ownerUserId: string): Promise<OrganizationRow | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.organizations, [
    Query.equal('ownerUserId', ownerUserId),
    Query.limit(1),
  ]);

  return response.documents.length > 0 ? toOrganizationRow(response.documents[0]) : null;
}

export async function createOrganization(ownerUserId: string, name: string): Promise<OrganizationRow> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.organizations, ID.unique(), {
    ownerUserId,
    name,
  });

  return toOrganizationRow(doc);
}

export async function getOrganizationById(organizationId: string): Promise<OrganizationRow | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.organizations, organizationId);
    return toOrganizationRow(doc);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function ensureOrganizationForOwner(ownerUserId: string, ownerName: string): Promise<OrganizationRow> {
  const existing = await getOrganizationByOwnerUserId(ownerUserId);
  if (existing) return existing;

  const displayName = ownerName.trim() || 'Ma boutique';
  const name = displayName.includes('ntreprise') ? displayName : `Entreprise ${displayName}`;

  return createOrganization(ownerUserId, name);
}

export async function listStoresForOwner(ownerUserId: string, ownerName: string): Promise<ShopRow[]> {
  const organization = await ensureOrganizationForOwner(ownerUserId, ownerName);
  return listShopsByOrganization(organization.$id);
}

export async function createStoreForOwner(
  ownerUserId: string,
  ownerName: string,
  body: Record<string, unknown>
): Promise<ShopRow> {
  const name = String(body.name ?? '').trim();

  if (name.length < 2) {
    throw userError('Donne un nom de boutique plus complet.', 400, 'STORE_NAME_TOO_SHORT');
  }

  const organization = await ensureOrganizationForOwner(ownerUserId, ownerName);

  return createAdditionalShop({
    organizationId: organization.$id,
    ownerUserId,
    ownerName,
    name,
  });
}

export async function switchActiveStore(ownerUserId: string, shopId: string): Promise<ShopRow> {
  const shop = await getShopById(shopId);

  if (!shop) {
    throw userError('Boutique introuvable.', 404, 'ORG_STORE_NOT_FOUND');
  }

  if (shop.ownerUserId !== ownerUserId) {
    throw userError('Cette boutique ne t\'appartient pas.', 403, 'ORG_STORE_FORBIDDEN');
  }

  await updateUserProfileShopId(ownerUserId, shop.$id);

  return shop;
}
