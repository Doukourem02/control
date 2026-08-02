import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type TeamService = typeof import('./team.service');
let inviteMember: TeamService['inviteMember'];

let mockExistingMembers: unknown[] = [];
const captured: { input: Record<string, unknown> | null } = { input: null };

before(() => {
  const teamRepoPath = req.resolve('./team.repository');
  req.cache[teamRepoPath] = {
    exports: {
      createMember: async (input: Record<string, unknown>) => {
        captured.input = input;
        return { $id: 'member-new', ...input, status: 'pending' };
      },
      listMembersByShop: async () => mockExistingMembers,
      getActiveMemberByUserId: async () => null,
      getMemberById: async () => null,
      getMemberByInviteCode: async () => null,
      updateMember: async (id: string, patch: Record<string, unknown>) => ({ $id: id, ...patch }),
    },
  } as unknown as NodeJS.Module;

  const usersRepoPath = req.resolve('../users/users.repository');
  req.cache[usersRepoPath] = {
    exports: {
      getUserProfileByUserId: async () => null,
      upsertUserProfile: async (input: unknown) => input,
    },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('./team.service')];
  ({ inviteMember } = req('./team.service') as TeamService);
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
