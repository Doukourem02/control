import { randomBytes } from 'crypto';
import { userError } from '../../utils/http';
import { getUserProfileByUserId, upsertUserProfile, type AccountRole } from '../users/users.repository';
import {
  createMember,
  getActiveMemberByUserId,
  getMemberById,
  getMemberByInviteCode,
  listMembersByShop,
  updateMember,
  type MemberRole,
} from './team.repository';

const INVITE_ROLES: MemberRole[] = ['seller', 'manager', 'comptable'];

function generateInviteCode(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}

function readInviteRole(value: unknown): MemberRole {
  const role = String(value ?? 'seller').trim().toLowerCase();

  if ((INVITE_ROLES as string[]).includes(role)) {
    return role as MemberRole;
  }

  throw userError('Selectionne un role valide (vendeuse, manager ou comptable).', 400, 'TEAM_ROLE_INVALID');
}

export function isInviteExpired(expiresAt: string, createdAt?: string) {
  const expiry = expiresAt || (createdAt ? new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : '');
  if (!expiry) return false;

  return new Date(expiry).getTime() <= Date.now();
}

export function assertInviteUsable(member: { status: string; expiresAt: string; $createdAt?: string }) {
  if (member.status === 'removed') {
    throw userError('Cette invitation a ete revoquee.', 410, 'TEAM_CODE_REVOKED');
  }

  if (member.status === 'active') {
    throw userError('Ce code a deja ete utilise.', 409, 'TEAM_CODE_USED');
  }

  if (isInviteExpired(member.expiresAt, member.$createdAt)) {
    throw userError('Ce code d\'invitation a expire.', 410, 'TEAM_CODE_EXPIRED');
  }
}

export async function getTeamMembers(shopId: string) {
  return listMembersByShop(shopId);
}

export async function inviteMember(shopId: string, body: Record<string, unknown>, inviterRole: AccountRole) {
  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim();
  // Seul le proprietaire choisit librement le role invite (vendeuse/manager/
  // comptable). Un manager qui recrute un "apprenti" ne peut le placer qu'au
  // niveau vendeuse — jamais a son propre niveau ou au-dessus.
  const role = inviterRole === 'owner' ? readInviteRole(body.role) : 'seller';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw userError('Adresse email invalide.', 400, 'TEAM_EMAIL_INVALID');
  }

  if (!name || name.length < 2) {
    throw userError('Renseigne le nom du membre.', 400, 'TEAM_NAME_REQUIRED');
  }

  const existing = await listMembersByShop(shopId);
  const alreadyInvited = existing.find(
    (m) => m.email === email && m.status !== 'removed'
  );

  if (alreadyInvited) {
    throw userError('Cette personne est deja dans votre equipe.', 409, 'TEAM_ALREADY_MEMBER');
  }

  const inviteCode = generateInviteCode();

  return createMember({ shopId, email, name, role, inviteCode });
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

  assertInviteUsable(member);

  const updatedMember = await updateMember(member.$id, { userId, status: 'active' });
  await upsertUserProfile({
    userId,
    accountRole: updatedMember.role,
    shopId: updatedMember.shopId,
    onboardingCompleted: 'true',
  });

  return updatedMember;
}

export async function getMyRole(shopId: string, userId: string): Promise<AccountRole> {
  const profile = await getUserProfileByUserId(userId);
  if (profile) return profile.accountRole;

  return userId === shopId ? 'owner' : 'seller';
}

export { getActiveMemberByUserId };
