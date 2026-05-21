import { ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';

export type MemberStatus = 'pending' | 'active' | 'removed';
export type MemberRole = 'seller';

export type MemberRow = {
  $id: string;
  $createdAt: string;
  shopId: string;
  email: string;
  name: string;
  userId: string | null;
  role: MemberRole;
  inviteCode: string;
  status: MemberStatus;
};

function toMemberRow(doc: any): MemberRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    shopId: doc.shopId as string,
    email: doc.email as string,
    name: (doc.name ?? '') as string,
    userId: (doc.userId ?? null) as string | null,
    role: (doc.role ?? 'seller') as MemberRole,
    inviteCode: doc.inviteCode as string,
    status: (doc.status ?? 'pending') as MemberStatus,
  };
}

export async function createMember(input: {
  shopId: string;
  email: string;
  name: string;
  inviteCode: string;
}): Promise<MemberRow> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.members, ID.unique(), {
    shopId: input.shopId,
    email: input.email.toLowerCase().trim(),
    name: input.name,
    userId: null,
    role: 'seller',
    inviteCode: input.inviteCode,
    status: 'pending',
  });
  return toMemberRow(doc);
}

export async function listMembersByShop(shopId: string): Promise<MemberRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.members, [
    Query.equal('shopId', shopId),
    Query.notEqual('status', 'removed'),
    Query.orderDesc('$createdAt'),
    Query.limit(50),
  ]);
  return response.documents.map(toMemberRow);
}

export async function getMemberByInviteCode(inviteCode: string): Promise<MemberRow | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.members, [
    Query.equal('inviteCode', inviteCode),
    Query.limit(1),
  ]);
  return response.documents.length > 0 ? toMemberRow(response.documents[0]) : null;
}

export async function getActiveMemberByUserId(userId: string): Promise<MemberRow | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.members, [
    Query.equal('userId', userId),
    Query.equal('status', 'active'),
    Query.limit(1),
  ]);
  return response.documents.length > 0 ? toMemberRow(response.documents[0]) : null;
}

export async function updateMember(memberId: string, patch: Partial<{
  userId: string;
  name: string;
  status: MemberStatus;
}>): Promise<MemberRow> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.members, memberId, patch);
  return toMemberRow(doc);
}

export async function getMemberById(memberId: string): Promise<MemberRow | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.members, memberId);
    return toMemberRow(doc);
  } catch {
    return null;
  }
}
