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
  paymentMethods: string;
  defaultClosingTime: string;
  amountsVisibleByDefault: string;
  displayLanguage: string;
  defaultUnit: string;
  stockLowAlertsEnabled: string;
  closureReminderEnabled: string;
  cashGapAlertsEnabled: string;
  defaultLowStockThreshold: string;
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
    paymentMethods: 'Cash,Mobile Money',
    defaultClosingTime: '20:00',
    amountsVisibleByDefault: 'true',
    displayLanguage: 'fr',
    defaultUnit: 'piece',
    stockLowAlertsEnabled: 'true',
    closureReminderEnabled: 'true',
    cashGapAlertsEnabled: 'true',
    defaultLowStockThreshold: '5',
  });

  return toShopRow(doc);
}

export async function updateShopById(shopId: string, input: UpdateShopInput): Promise<ShopRow> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.shops, shopId, input);
  return toShopRow(doc);
}
