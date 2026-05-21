import { Router } from 'express';
import {
  inviteMemberHandler,
  joinShopHandler,
  listMembersHandler,
  myRoleHandler,
  removeMemberHandler,
} from './team.controller';

export const teamRouter = Router();

teamRouter.get('/api/team/members', listMembersHandler);
teamRouter.get('/api/team/role', myRoleHandler);
teamRouter.post('/api/team/invite', inviteMemberHandler);
teamRouter.post('/api/team/join', joinShopHandler);
teamRouter.delete('/api/team/members/:memberId', removeMemberHandler);
