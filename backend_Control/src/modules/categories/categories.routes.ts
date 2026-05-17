import { Router } from 'express';
import { createCategoryHandler, deleteCategoryHandler, listCategories } from './categories.controller';

export const categoriesRouter = Router();

categoriesRouter.get('/api/categories', listCategories);
categoriesRouter.post('/api/categories', createCategoryHandler);
categoriesRouter.delete('/api/categories/:id', deleteCategoryHandler);
