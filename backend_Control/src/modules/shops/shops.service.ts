import { userError } from '../../utils/http';
import { getActiveMemberByUserId } from '../team/team.repository';
import { createShopForUser, getShopById, updateShopById, type UpdateShopInput } from './shops.repository';

export async function getOrCreateCurrentShop(userId: string, ownerName: string) {
  // Seller: look up active membership in another shop first
  const membership = await getActiveMemberByUserId(userId);
  if (membership) {
    const ownerShop = await getShopById(membership.shopId);
    if (ownerShop) return ownerShop;
  }

  const existingShop = await getShopById(userId);
  if (existingShop) return existingShop;

  return createShopForUser(userId, ownerName);
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

export async function updateCurrentShop(userId: string, body: Record<string, unknown>) {
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

  return updateShopById(userId, input);
}
