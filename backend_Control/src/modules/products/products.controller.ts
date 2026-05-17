import type { Request, Response } from 'express';

import { getShopId } from '../../utils/http';
import { createOrSupplyProduct, getProducts } from './products.service';

export async function listProducts(request: Request, response: Response) {
  const products = await getProducts(getShopId(request));

  response.json({ products });
}

export async function createProduct(request: Request, response: Response) {
  const result = await createOrSupplyProduct(request.body, getShopId(request));

  response.status(result.statusCode).json({ product: result.product });
}
