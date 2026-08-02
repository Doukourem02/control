import { Router } from 'express';

import { requireOperationalRole } from '../../middleware/roles';
import { createProduct, deleteProduct, listProducts, patchProduct } from './products.controller';

export const productsRouter = Router();

productsRouter.get('/api/products', listProducts);
productsRouter.post('/api/products', requireOperationalRole, createProduct);
productsRouter.patch('/api/products/:id', requireOperationalRole, patchProduct);
productsRouter.delete('/api/products/:id', requireOperationalRole, deleteProduct);
