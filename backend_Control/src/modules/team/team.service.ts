import { randomBytes } from 'crypto';
import { userError } from '../../utils/http';
import { getUserProfileByUserId, upsertUserProfile } from '../users/users.repository';
import {
  createMember,
  getActiveMemberByUserId,
  getMemberById,
  getMemberByInviteCode,
  listMembersByShop,
  updateMember,
} from './team.repository';

function generateInviteCode(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}

export async function getTeamMembers(shopId: string) {
  return listMembersByShop(shopId);
}

export async function inviteMember(shopId: string, body: Record<string, unknown>) {
  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw userError('Adresse email invalide.', 400, 'TEAM_EMAIL_INVALID');
  }

  if (!name || name.length < 2) {
    throw userError('Renseigne le nom de la vendeuse.', 400, 'TEAM_NAME_REQUIRED');
  }

  const existing = await listMembersByShop(shopId);
  const alreadyInvited = existing.find(
    (m) => m.email === email && m.status !== 'removed'
  );

  if (alreadyInvited) {
    throw userError('Cette personne est deja dans votre equipe.', 409, 'TEAM_ALREADY_MEMBER');
  }

  const inviteCode = generateInviteCode();

  return createMember({ shopId, email, name, inviteCode });
}

export async function removeMember(shopId: string, memberId: string) {
  const member = await getMemberById(memberId);

  if (!member || member.shopId !== shopId) {
    throw userError('Membre introuvable.', 404, 'TEAM_MEMBER_NOT_FOUND');
  }

  if (member.status === 'removed') {
    throw userError('Ce membre a deja ete retire.', 409, 'TEAM_MEMBER_ALREADY_REMOVED');
  }

  return updateMember(memberId, { status: 'removed' });
}

export async function joinShop(userId: string, body: Record<string, unknown>) {
  const rawCode = String(body.inviteCode ?? '').trim().toUpperCase();

  if (!rawCode) {
    throw userError('Renseigne le code d\'invitation.', 400, 'TEAM_CODE_REQUIRED');
  }

  const existing = await getActiveMemberByUserId(userId);
  if (existing) {
    throw userError('Tu fais deja partie d\'une boutique.', 409, 'TEAM_ALREADY_JOINED');
  }

  const member = await getMemberByInviteCode(rawCode);

  if (!member) {
    throw userError('Code d\'invitation invalide.', 404, 'TEAM_CODE_INVALID');
  }

  if (member.status === 'removed') {
    throw userError('Cette invitation a ete revoquee.', 410, 'TEAM_CODE_REVOKED');
  }

  if (member.status === 'active') {
    throw userError('Ce code a deja ete utilise.', 409, 'TEAM_CODE_USED');
  }

  const updatedMember = await updateMember(member.$id, { userId, status: 'active' });
  await upsertUserProfile({
    userId,
    accountRole: 'seller',
    shopId: updatedMember.shopId,
    onboardingCompleted: 'true',
  });

  return updatedMember;
}

export async function getMyRole(shopId: string, userId: string): Promise<'owner' | 'seller'> {
  const profile = await getUserProfileByUserId(userId);
  if (profile) return profile.accountRole;

  return userId === shopId ? 'owner' : 'seller';
}

export { getActiveMemberByUserId };
