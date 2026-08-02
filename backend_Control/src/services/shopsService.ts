import { AppwriteException, ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';
import { BUCKETS } from '../config/appwrite';
import { userError } from '../utils/http';
import { decodeBase64Photo, getPhotoFile, replacePhoto } from '../utils/photoStorage';
import { ensureOrganizationForOwner } from './organizationsService';
import { getActiveMemberByUserId } from './teamService';

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

const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4 Mo — la photo est deja compressee cote app

export async function getOrCreateCurrentShop(userId: string, ownerName: string) {
  // Seller: look up active membership in another shop first
  const membership = await getActiveMemberByUserId(userId);
  if (membership) {
    const ownerShop = await getShopById(membership.shopId);
    if (ownerShop) return ownerShop;
  }

  const existingShop = await getShopById(userId);
  if (existingShop) return existingShop;

  const organization = await ensureOrganizationForOwner(userId, ownerName);
  return createShopForUser(userId, ownerName, organization.$id);
}

/**
 * Resout la boutique active d'un owner : prefere le pointeur explicite
 * (user_profiles.shopId, mis a jour par le store switcher) ; retombe sur la
 * boutique primaire si absent/introuvable (comportement historique, et cas
 * d'un tout nouvel owner sans boutique du tout).
 */
export async function getActiveShopForOwner(
  userId: string,
  profileShopId: string | undefined,
  ownerName: string
): Promise<ShopRow> {
  if (profileShopId) {
    const activeShop = await getShopById(profileShopId);
    if (activeShop) return activeShop;
  }

  return getOrCreateCurrentShop(userId, ownerName);
}

function readOptionalText(value: unknown, maxLength: number) {
  if (typeof value === 'undefined') return undefined;
  const text = String(value ?? '').trim();

  if (text.length > maxLength) {
    throw userError(`Ce champ ne doit pas depasser ${maxLength} caracteres.`, 400, 'FIELD_TOO_LONG');
  }

  return text;
}

const currencies = ['FCFA', 'EUR', 'USD', 'GNF'] as const;
const paymentMethods = ['Cash', 'Mobile Money'] as const;
const displayLanguages = ['fr', 'en'] as const;
const defaultUnits = ['kg', 'piece', 'carton', 'tas', 'unite'] as const;

function readCurrency(value: unknown) {
  if (typeof value === 'undefined') return undefined;
  const currency = String(value ?? '').trim().toUpperCase();

  if (!currencies.includes(currency as (typeof currencies)[number])) {
    throw userError('Selectionne une devise valide.', 400, 'SHOP_CURRENCY_INVALID');
  }

  return currency;
}

function readPaymentMethods(value: unknown) {
  if (typeof value === 'undefined') return undefined;
  const values = Array.isArray(value)
    ? value.map((item) => String(item).trim())
    : String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  const uniqueValues = Array.from(new Set(values));

  if (uniqueValues.length === 0) {
    throw userError('Active au moins un mode de paiement.', 400, 'SHOP_PAYMENT_METHODS_REQUIRED');
  }

  if (!uniqueValues.every((method) => paymentMethods.includes(method as (typeof paymentMethods)[number]))) {
    throw userError('Selectionne des modes de paiement valides.', 400, 'SHOP_PAYMENT_METHOD_INVALID');
  }

  return uniqueValues.join(',');
}

function readClosingTime(value: unknown) {
  if (typeof value === 'undefined') return undefined;
  const time = String(value ?? '').trim();

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw userError('Renseigne une heure de cloture valide.', 400, 'SHOP_CLOSING_TIME_INVALID');
  }

  return time;
}

function readBooleanString(value: unknown) {
  if (typeof value === 'undefined') return undefined;

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  const text = String(value ?? '').trim().toLowerCase();

  if (text === 'true' || text === 'false') {
    return text;
  }

  throw userError('Selectionne une preference valide.', 400, 'SHOP_DISPLAY_PREFERENCE_INVALID');
}

function readDisplayLanguage(value: unknown) {
  if (typeof value === 'undefined') return undefined;
  const language = String(value ?? '').trim().toLowerCase();

  if (!displayLanguages.includes(language as (typeof displayLanguages)[number])) {
    throw userError('Selectionne une langue valide.', 400, 'SHOP_LANGUAGE_INVALID');
  }

  return language;
}

function readDefaultUnit(value: unknown) {
  if (typeof value === 'undefined') return undefined;
  const unit = String(value ?? '').trim();

  if (!defaultUnits.includes(unit as (typeof defaultUnits)[number])) {
    throw userError('Selectionne une unite valide.', 400, 'SHOP_DEFAULT_UNIT_INVALID');
  }

  return unit;
}

function readLowStockThreshold(value: unknown) {
  if (typeof value === 'undefined') return undefined;
  const threshold = String(value ?? '').trim();

  if (!/^\d+$/.test(threshold)) {
    throw userError('Renseigne un seuil de stock valide.', 400, 'SHOP_LOW_STOCK_THRESHOLD_INVALID');
  }

  const parsed = Number(threshold);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
    throw userError('Renseigne un seuil de stock entre 1 et 999.', 400, 'SHOP_LOW_STOCK_THRESHOLD_INVALID');
  }

  return String(parsed);
}

export async function updateCurrentShop(shopId: string, body: Record<string, unknown>) {
  const name = readOptionalText(body.name, 80);
  const currency = readCurrency(body.currency);
  const contact = readOptionalText(body.contact, 80);
  const address = readOptionalText(body.address, 140);
  const openingHours = readOptionalText(body.openingHours, 80);
  const selectedPaymentMethods = readPaymentMethods(body.paymentMethods);
  const defaultClosingTime = readClosingTime(body.defaultClosingTime);
  const amountsVisibleByDefault = readBooleanString(body.amountsVisibleByDefault);
  const displayLanguage = readDisplayLanguage(body.displayLanguage);
  const defaultUnit = readDefaultUnit(body.defaultUnit);
  const stockLowAlertsEnabled = readBooleanString(body.stockLowAlertsEnabled);
  const closureReminderEnabled = readBooleanString(body.closureReminderEnabled);
  const cashGapAlertsEnabled = readBooleanString(body.cashGapAlertsEnabled);
  const defaultLowStockThreshold = readLowStockThreshold(body.defaultLowStockThreshold);

  if (typeof name !== 'undefined' && name.length < 2) {
    throw userError('Donne un nom de boutique plus complet.', 400, 'SHOP_NAME_TOO_SHORT');
  }

  const input: UpdateShopInput = {};
  if (typeof name !== 'undefined') input.name = name;
  if (typeof currency !== 'undefined') input.currency = currency;
  if (typeof contact !== 'undefined') input.contact = contact;
  if (typeof address !== 'undefined') input.address = address;
  if (typeof openingHours !== 'undefined') input.openingHours = openingHours;
  if (typeof selectedPaymentMethods !== 'undefined') input.paymentMethods = selectedPaymentMethods;
  if (typeof defaultClosingTime !== 'undefined') input.defaultClosingTime = defaultClosingTime;
  if (typeof amountsVisibleByDefault !== 'undefined') input.amountsVisibleByDefault = amountsVisibleByDefault;
  if (typeof displayLanguage !== 'undefined') input.displayLanguage = displayLanguage;
  if (typeof defaultUnit !== 'undefined') input.defaultUnit = defaultUnit;
  if (typeof stockLowAlertsEnabled !== 'undefined') input.stockLowAlertsEnabled = stockLowAlertsEnabled;
  if (typeof closureReminderEnabled !== 'undefined') input.closureReminderEnabled = closureReminderEnabled;
  if (typeof cashGapAlertsEnabled !== 'undefined') input.cashGapAlertsEnabled = cashGapAlertsEnabled;
  if (typeof defaultLowStockThreshold !== 'undefined') input.defaultLowStockThreshold = defaultLowStockThreshold;

  const logo = decodeBase64Photo(body.logoPhoto, body.logoPhotoType, MAX_LOGO_BYTES);
  if (logo) {
    const currentShop = await getShopById(shopId);
    input.logoFileId = await replacePhoto(
      BUCKETS.photos,
      currentShop?.logoFileId || undefined,
      logo.buffer,
      `${shopId}-${Date.now()}.${logo.mimeType.split('/')[1] ?? 'jpg'}`
    );
  }

  return updateShopById(shopId, input);
}

export async function getShopLogo(shopId: string) {
  const shop = await getShopById(shopId);

  if (!shop || !shop.logoFileId) {
    throw userError('Logo introuvable.', 404, 'SHOP_LOGO_NOT_FOUND');
  }

  const file = await getPhotoFile(BUCKETS.photos, shop.logoFileId);

  if (!file) {
    throw userError('Logo introuvable.', 404, 'SHOP_LOGO_NOT_FOUND');
  }

  return file;
}
