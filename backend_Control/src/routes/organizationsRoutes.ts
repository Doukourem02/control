import { Router } from 'express';

import { activateStoreHandler, createStoreHandler, listStoresHandler } from '../controllers/organizationsController';

export const organizationsRouter = Router();

organizationsRouter.get('/api/organizations/stores', listStoresHandler);
organizationsRouter.post('/api/organizations/stores', createStoreHandler);
organizationsRouter.post('/api/organizations/stores/:shopId/activate', activateStoreHandler);
