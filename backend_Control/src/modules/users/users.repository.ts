import { AppwriteException, Query } from 'node-appwrite';

import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';

export type AccountRole = 'owner' | 'seller';

export type UserProfileRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  accountRole: AccountRole;
  shopId: string;
  onboardingCompleted: string;
};

function toUserProfileRow(doc: any): UserProfileRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    userId: doc.userId as string,
    accountRole: doc.accountRole as AccountRole,
    shopId: (doc.shopId ?? '') as string,
    onboardingCompleted: (doc.onboardingCompleted ?? 'false') as string,
  };
}

function isNotFound(error: unknown) {
  return error instanceof AppwriteException && error.code === 404;
}

export async function getUserProfileByUserId(userId: string): Promise<UserProfileRow | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.userProfiles, userId);
    return toUserProfileRow(doc);
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.userProfiles, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);

    return response.documents.length > 0 ? toUserProfileRow(response.documents[0]) : null;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function upsertUserProfile(input: {
  userId: string;
  accountRole: AccountRole;
  shopId?: string;
  onboardingCompleted?: string;
}): Promise<UserProfileRow> {
  const payload = {
    userId: input.userId,
    accountRole: input.accountRole,
    shopId: input.shopId ?? '',
    onboardingCompleted: input.onboardingCompleted ?? 'false',
  };

  try {
    const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.userProfiles, input.userId, payload);
    return toUserProfileRow(doc);
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.userProfiles, input.userId, payload);
  return toUserProfileRow(doc);
}
