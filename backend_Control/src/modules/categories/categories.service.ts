import {
  createCategoryRecord,
  deleteCategoryRecord,
  listCategoriesByShop,
} from './categories.repository';
import { userError } from '../../utils/http';

export async function getCategories(shopId: string) {
  return listCategoriesByShop(shopId);
}

export async function createCategory(body: Record<string, unknown>, shopId: string) {
  const name = String(body.name ?? '').trim();
  const emoji = String(body.emoji ?? '📦').trim();

  if (!name) {
    throw userError('Le nom de la categorie est requis.', 400, 'CATEGORY_NAME_REQUIRED');
  }

  return createCategoryRecord(shopId, name, emoji);
}

export async function deleteCategory(categoryId: string, shopId: string) {
  if (!categoryId) {
    throw userError('ID de categorie manquant.', 400, 'CATEGORY_ID_REQUIRED');
  }

  await deleteCategoryRecord(categoryId, shopId);
}
