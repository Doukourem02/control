import { Router } from 'express';

import { createMissingController, getMissingsController } from './missing.controller';

export const missingRouter = Router();

missingRouter.get('/api/missings', getMissingsController);
missingRouter.post('/api/missings', createMissingController);
