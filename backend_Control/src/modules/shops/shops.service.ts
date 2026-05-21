import { userError } from '../../utils/http';
import { createShopForUser, getShopById, updateShopById, type UpdateShopInput } from './shops.repository';

export async function getOrCreateCurrentShop(userId: string, ownerName: string) {
  const existingShop = await getShopById(userId);

  if (existingShop) {
    return existingShop;
  }

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

export async function updateCurrentShop(userId: string, body: Record<string, unknown>) {
  const name = readOptionalText(body.name, 80);
  const contact = readOptionalText(body.contact, 80);
  const address = readOptionalText(body.address, 140);
  const openingHours = readOptionalText(body.openingHours, 80);

  if (typeof name !== 'undefined' && name.length < 2) {
    throw userError('Donne un nom de boutique plus complet.', 400, 'SHOP_NAME_TOO_SHORT');
  }

  const input: UpdateShopInput = {};
  if (typeof name !== 'undefined') input.name = name;
  if (typeof contact !== 'undefined') input.contact = contact;
  if (typeof address !== 'undefined') input.address = address;
  if (typeof openingHours !== 'undefined') input.openingHours = openingHours;

  return updateShopById(userId, input);
}
