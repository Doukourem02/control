import type { Request, Response } from 'express';

import { getShopId } from '../../utils/http';
import { archiveProduct, createOrSupplyProduct, getProducts, updateProduct } from './products.service';

export async function listProducts(request: Request, response: Response) {
  const products = await getProducts(getShopId(request));
  response.json({ products });
}

export async function createProduct(request: Request, response: Response) {
  const result = await createOrSupplyProduct(request.body, getShopId(request));
  response.status(result.statusCode).json({ product: result.product });
}

export async function patchProduct(request: Request, response: Response) {
  const shopId = getShopId(request);
  const productId = String(request.params['id'] ?? '');
  const product = await updateProduct(productId, shopId, request.body as Record<string, unknown>);
  response.json({ product });
}

export async function deleteProduct(request: Request, response: Response) {
  const shopId = getShopId(request);
  const productId = String(request.params['id'] ?? '');
  await archiveProduct(productId, shopId);
  response.status(204).end();
}
