import { Router } from 'express';

import { getCurrentShop, getShopLogoController, updateCurrentShopSettings } from './shops.controller';

export const shopsRouter = Router();

shopsRouter.get('/api/shops/current', getCurrentShop);
shopsRouter.get('/api/shops/current/logo', getShopLogoController);
shopsRouter.patch('/api/shops/current', updateCurrentShopSettings);
