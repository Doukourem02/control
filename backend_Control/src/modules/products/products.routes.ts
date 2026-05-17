import { Router } from 'express';

import { createProduct, listProducts } from './products.controller';

export const productsRouter = Router();

productsRouter.get('/api/products', listProducts);
productsRouter.post('/api/products', createProduct);
