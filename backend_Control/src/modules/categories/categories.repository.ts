import { ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { CategoryRow } from '../../types/control';

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

export async function deleteCategoryRecord(categoryId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.categories, categoryId);
}
