import { Router } from 'express';

import { createProduct, deleteProduct, listProducts, patchProduct } from './products.controller';

export const productsRouter = Router();

productsRouter.get('/api/products', listProducts);
productsRouter.post('/api/products', createProduct);
productsRouter.patch('/api/products/:id', patchProduct);
productsRouter.delete('/api/products/:id', deleteProduct);
