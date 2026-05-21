import { AppwriteException } from 'node-appwrite';

import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';

export type ShopRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  ownerUserId: string;
  ownerName: string;
  name: string;
  currency: string;
  contact: string;
  address: string;
  openingHours: string;
};

export type UpdateShopInput = {
  name?: string;
  contact?: string;
  address?: string;
  openingHours?: string;
};

function toShopRow(doc: any): ShopRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    ownerUserId: doc.ownerUserId,
    ownerName: doc.ownerName ?? '',
    name: doc.name,
    currency: doc.currency ?? 'FCFA',
    contact: doc.contact ?? '',
    address: doc.address ?? '',
    openingHours: doc.openingHours ?? '',
  };
}

function isNotFound(error: unknown) {
  return error instanceof AppwriteException && error.code === 404;
}

export async function getShopById(shopId: string): Promise<ShopRow | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.shops, shopId);
    return toShopRow(doc);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function createShopForUser(userId: string, ownerName: string): Promise<ShopRow> {
  const displayName = ownerName.trim() || 'Ma boutique';

  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.shops, userId, {
    ownerUserId: userId,
    ownerName: displayName,
    name: displayName.includes('boutique') || displayName.includes('Boutique')
      ? displayName
      : `Boutique ${displayName}`,
    currency: 'FCFA',
    contact: '',
    address: '',
    openingHours: '',
  });

  return toShopRow(doc);
}

export async function updateShopById(shopId: string, input: UpdateShopInput): Promise<ShopRow> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.shops, shopId, input);
  return toShopRow(doc);
}
