import { Router } from 'express';

import { getCurrentShop, updateCurrentShopSettings } from './shops.controller';

export const shopsRouter = Router();

shopsRouter.get('/api/shops/current', getCurrentShop);
shopsRouter.patch('/api/shops/current', updateCurrentShopSettings);
