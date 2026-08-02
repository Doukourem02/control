import { userError } from '../../utils/http';
import { updateUserProfileShopId } from '../users/users.repository';
import {
  createAdditionalShop,
  getShopById,
  listShopsByOrganization,
  type ShopRow,
} from '../shops/shops.repository';
import { createOrganization, getOrganizationByOwnerUserId, type OrganizationRow } from './organizations.repository';

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
