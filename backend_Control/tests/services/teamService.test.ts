import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type TeamService = typeof import('../../src/services/teamService');
let inviteMember: TeamService['inviteMember'];

let mockExistingMembers: unknown[] = [];
const captured: { input: Record<string, unknown> | null } = { input: null };

const MEMBERS = 'members';

before(() => {
  // team.repository a ete fusionne dans team.service : on simule
  // directement le client Appwrite plutot qu'un module repository.
  const appwritePath = req.resolve('../../src/config/appwrite');
  req.cache[appwritePath] = {
    exports: {
      DATABASE_ID: 'db-test',
      COLLECTIONS: { members: MEMBERS },
      databases: {
        listDocuments: async (_db: string, collectionId: string) => {
          if (collectionId !== MEMBERS) return { documents: [] };
          return { documents: mockExistingMembers };
        },
        createDocument: async (_db: string, _collectionId: string, _id: string, data: Record<string, unknown>) => {
          captured.input = data;
          return { $id: 'member-new', ...data, status: 'pending' };
        },
        getDocument: async () => {
          throw new Error('not found');
        },
        updateDocument: async (_db: string, _collectionId: string, id: string, patch: Record<string, unknown>) => ({
          $id: id,
          ...patch,
        }),
      },
    },
  } as unknown as NodeJS.Module;

  const usersRepoPath = req.resolve('../../src/services/usersService');
  req.cache[usersRepoPath] = {
    exports: {
      getUserProfileByUserId: async () => null,
      upsertUserProfile: async (input: unknown) => input,
    },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('../../src/services/teamService')];
  ({ inviteMember } = req('../../src/services/teamService') as TeamService);
});

describe('team.service – inviteMember privilege boundaries', () => {
  before(() => {
    mockExistingMembers = [];
  });

  it('lets the owner choose any role freely', async () => {
    captured.input = null;
    await inviteMember('shop-1', { email: 'gerant@example.com', name: 'Gerant', role: 'manager' }, 'owner');

    assert.equal((captured.input as { role?: string } | null)?.role, 'manager');
  });

  it('forces the seller role when a manager invites someone, even if a different role is requested', async () => {
    captured.input = null;
    await inviteMember(
      'shop-1',
      { email: 'apprenti@example.com', name: 'Apprenti', role: 'manager' },
      'manager'
    );

    // Un manager qui recrute ne peut jamais placer quelqu'un a son propre
    // niveau (ou au-dessus) — c'est la garde-fou anti-escalade de privileges.
    assert.equal((captured.input as { role?: string } | null)?.role, 'seller');
  });

  it('forces the seller role for a manager even without an explicit role in the body', async () => {
    captured.input = null;
    await inviteMember('shop-1', { email: 'apprenti2@example.com', name: 'Apprenti 2' }, 'manager');

    assert.equal((captured.input as { role?: string } | null)?.role, 'seller');
  });
});
