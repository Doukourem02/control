import { Router } from 'express';

import { requireOperationalRole } from '../../middleware/roles';
import { createMissingController, getMissingsController } from './missing.controller';

export const missingRouter = Router();

missingRouter.get('/api/missings', getMissingsController);
missingRouter.post('/api/missings', requireOperationalRole, createMissingController);
