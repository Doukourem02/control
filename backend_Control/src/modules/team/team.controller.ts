import type { Request, Response } from 'express';
import { getShopId } from '../../utils/http';
import { getMyRole, getTeamMembers, inviteMember, joinShop, removeMember } from './team.service';

export async function listMembersHandler(request: Request, response: Response): Promise<void> {
  const shopId = getShopId(request);
  const members = await getTeamMembers(shopId);
  response.json({ members });
}

export async function inviteMemberHandler(request: Request, response: Response): Promise<void> {
  if (!request.auth) { response.status(401).json({ error: 'Non autorise.', code: 'AUTH_REQUIRED' }); return; }
  const shopId = getShopId(request);
  const userId = request.auth.userId;

  if (userId !== shopId) {
    response.status(403).json({ error: 'Seul le proprietaire peut inviter des membres.', code: 'TEAM_OWNER_ONLY' });
    return;
  }

  const member = await inviteMember(shopId, request.body as Record<string, unknown>);
  response.status(201).json({ member });
}

export async function removeMemberHandler(request: Request, response: Response): Promise<void> {
  if (!request.auth) { response.status(401).json({ error: 'Non autorise.', code: 'AUTH_REQUIRED' }); return; }
  const shopId = getShopId(request);
  const userId = request.auth.userId;
  const memberId = String(request.params['memberId'] ?? '');

  if (userId !== shopId) {
    response.status(403).json({ error: 'Seul le proprietaire peut retirer des membres.', code: 'TEAM_OWNER_ONLY' });
    return;
  }

  const member = await removeMember(shopId, memberId);
  response.json({ member });
}

export async function joinShopHandler(request: Request, response: Response): Promise<void> {
  if (!request.auth) { response.status(401).json({ error: 'Non autorise.', code: 'AUTH_REQUIRED' }); return; }
  const userId = request.auth.userId;
  const member = await joinShop(userId, request.body as Record<string, unknown>);
  response.json({ member });
}

export async function myRoleHandler(request: Request, response: Response): Promise<void> {
  if (!request.auth) { response.status(401).json({ error: 'Non autorise.', code: 'AUTH_REQUIRED' }); return; }
  const shopId = getShopId(request);
  const userId = request.auth.userId;
  const role = await getMyRole(shopId, userId);
  response.json({ role });
}
