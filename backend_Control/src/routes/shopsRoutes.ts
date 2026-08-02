import { Router } from 'express';

import { getCurrentShop, getShopLogoController, updateCurrentShopSettings } from '../controllers/shopsController';

export const shopsRouter = Router();

shopsRouter.get('/api/shops/current', getCurrentShop);
shopsRouter.get('/api/shops/current/logo', getShopLogoController);
shopsRouter.patch('/api/shops/current', updateCurrentShopSettings);
