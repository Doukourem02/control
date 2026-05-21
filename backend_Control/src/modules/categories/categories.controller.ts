import type { Request, Response } from 'express';
import { getShopId } from '../../utils/http';
import { createCategory, deleteCategory, getCategories } from './categories.service';

export async function listCategories(request: Request, response: Response) {
  const categories = await getCategories(getShopId(request));
  response.json({ categories });
}

export async function createCategoryHandler(request: Request, response: Response) {
  const category = await createCategory(request.body, getShopId(request));
  response.status(201).json({ category });
}

export async function deleteCategoryHandler(request: Request, response: Response) {
  await deleteCategory(String(request.params.id), getShopId(request));
  response.json({ ok: true });
}
