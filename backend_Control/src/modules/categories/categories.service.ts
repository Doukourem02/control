import {
  createCategoryRecord,
  deleteCategoryRecord,
  listCategoriesByShop,
} from './categories.repository';

export async function getCategories(shopId: string) {
  return listCategoriesByShop(shopId);
}

export async function createCategory(body: Record<string, unknown>, shopId: string) {
  const name = String(body.name ?? '').trim();
  const emoji = String(body.emoji ?? '📦').trim();

  if (!name) {
    throw new Error('Le nom de la categorie est requis.');
  }

  return createCategoryRecord(shopId, name, emoji);
}

export async function deleteCategory(categoryId: string, shopId: string) {
  if (!categoryId) {
    throw new Error('ID de categorie manquant.');
  }

  await deleteCategoryRecord(categoryId, shopId);
}
