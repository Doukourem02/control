import { AppwriteException, ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';
import type { CategoryRow } from '../types/control';
import { userError } from '../utils/http';

function toCategoryRow(doc: any): CategoryRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc.shopId,
    name: doc.name,
    emoji: doc.emoji,
  };
}

export async function listCategoriesByShop(shopId: string): Promise<CategoryRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.categories, [
    Query.equal('shopId', shopId),
    Query.orderAsc('name'),
    Query.limit(100),
  ]);

  return response.documents.map(toCategoryRow);
}

export async function createCategoryRecord(shopId: string, name: string, emoji: string): Promise<CategoryRow> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.categories, ID.unique(), {
    shopId,
    name,
    emoji,
  });

  return toCategoryRow(doc);
}

export async function deleteCategoryRecord(categoryId: string, shopId: string): Promise<void> {
  let doc;

  try {
    doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.categories, categoryId);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      throw userError('Categorie introuvable pour cette boutique.', 404, 'CATEGORY_NOT_FOUND');
    }

    throw error;
  }

  if (doc.shopId !== shopId) {
    throw userError('Categorie introuvable pour cette boutique.', 404, 'CATEGORY_NOT_FOUND');
  }

  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.categories, categoryId);
}

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
