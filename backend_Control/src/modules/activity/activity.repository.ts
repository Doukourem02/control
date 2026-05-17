import { Query } from 'node-appwrite';;
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { ActivityLogRow } from '../../types/control';

function toActivityLogRow(doc: any): ActivityLogRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc['shopId'] as string,
    type: doc['type'] as ActivityLogRow['type'],
    actorName: doc['actorName'] as string,
    message: doc['message'] as string,
  };
}

export async function listRecentActivityByShop(shopId: string, limit: number): Promise<ActivityLogRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.activityLogs, [
    Query.equal('shopId', shopId),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ]);

  return response.documents.map(toActivityLogRow);
}
