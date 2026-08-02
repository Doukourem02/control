import { AppwriteException, ID, Query } from 'node-appwrite';

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
  paymentMethods: string;
  defaultClosingTime: string;
  amountsVisibleByDefault: string;
  displayLanguage: string;
  defaultUnit: string;
  stockLowAlertsEnabled: string;
  closureReminderEnabled: string;
  cashGapAlertsEnabled: string;
  defaultLowStockThreshold: string;
  logoFileId: string;
  organizationId: string;
};

export type UpdateShopInput = {
  name?: string;
  currency?: string;
  contact?: string;
  address?: string;
  openingHours?: string;
  paymentMethods?: string;
  defaultClosingTime?: string;
  amountsVisibleByDefault?: string;
  displayLanguage?: string;
  defaultUnit?: string;
  stockLowAlertsEnabled?: string;
  closureReminderEnabled?: string;
  cashGapAlertsEnabled?: string;
  defaultLowStockThreshold?: string;
  logoFileId?: string;
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
    paymentMethods: doc.paymentMethods ?? 'Cash,Mobile Money',
    defaultClosingTime: doc.defaultClosingTime ?? '20:00',
    amountsVisibleByDefault: doc.amountsVisibleByDefault ?? 'true',
    displayLanguage: doc.displayLanguage ?? 'fr',
    defaultUnit: doc.defaultUnit ?? 'piece',
    stockLowAlertsEnabled: doc.stockLowAlertsEnabled ?? 'true',
    closureReminderEnabled: doc.closureReminderEnabled ?? 'true',
    cashGapAlertsEnabled: doc.cashGapAlertsEnabled ?? 'true',
    defaultLowStockThreshold: doc.defaultLowStockThreshold ?? '5',
    logoFileId: doc.logoFileId ?? '',
    organizationId: doc.organizationId ?? '',
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

function defaultShopFields() {
  return {
    currency: 'FCFA',
    contact: '',
    address: '',
    openingHours: '',
    paymentMethods: 'Cash,Mobile Money',
    defaultClosingTime: '20:00',
    amountsVisibleByDefault: 'true',
    displayLanguage: 'fr',
    defaultUnit: 'piece',
    stockLowAlertsEnabled: 'true',
    closureReminderEnabled: 'true',
    cashGapAlertsEnabled: 'true',
    defaultLowStockThreshold: '5',
  };
}

export async function createShopForUser(
  userId: string,
  ownerName: string,
  organizationId: string
): Promise<ShopRow> {
  const displayName = ownerName.trim() || 'Ma boutique';

  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.shops, userId, {
    ownerUserId: userId,
    ownerName: displayName,
    name: displayName.includes('boutique') || displayName.includes('Boutique')
      ? displayName
      : `Boutique ${displayName}`,
    organizationId,
    ...defaultShopFields(),
  });

  return toShopRow(doc);
}

export async function createAdditionalShop(input: {
  organizationId: string;
  ownerUserId: string;
  ownerName: string;
  name: string;
}): Promise<ShopRow> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.shops, ID.unique(), {
    ownerUserId: input.ownerUserId,
    ownerName: input.ownerName.trim() || 'Ma boutique',
    name: input.name,
    organizationId: input.organizationId,
    ...defaultShopFields(),
  });

  return toShopRow(doc);
}

export async function listShopsByOrganization(organizationId: string): Promise<ShopRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.shops, [
    Query.equal('organizationId', organizationId),
    Query.orderAsc('$createdAt'),
    Query.limit(100),
  ]);

  return response.documents.map(toShopRow);
}

export async function updateShopById(shopId: string, input: UpdateShopInput): Promise<ShopRow> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.shops, shopId, input);
  return toShopRow(doc);
}
