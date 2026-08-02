import { AppwriteException, ID, Query } from 'node-appwrite';

import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';

export type OrganizationRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  ownerUserId: string;
  name: string;
};

function toOrganizationRow(doc: any): OrganizationRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    ownerUserId: doc.ownerUserId,
    name: doc.name,
  };
}

function isNotFound(error: unknown) {
  return error instanceof AppwriteException && error.code === 404;
}

export async function getOrganizationByOwnerUserId(ownerUserId: string): Promise<OrganizationRow | null> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.organizations, [
    Query.equal('ownerUserId', ownerUserId),
    Query.limit(1),
  ]);

  return response.documents.length > 0 ? toOrganizationRow(response.documents[0]) : null;
}

export async function createOrganization(ownerUserId: string, name: string): Promise<OrganizationRow> {
  const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.organizations, ID.unique(), {
    ownerUserId,
    name,
  });

  return toOrganizationRow(doc);
}

export async function getOrganizationById(organizationId: string): Promise<OrganizationRow | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.organizations, organizationId);
    return toOrganizationRow(doc);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
