import { productUnits, type ProductUnit } from '../../types/control';
import { parseAmount, userError } from '../../utils/http';
import { listProductsByShop, saveProductSupply } from './products.repository';

function isProductUnit(value: unknown): value is ProductUnit {
  return typeof value === 'string' && productUnits.includes(value as ProductUnit);
}

export async function getProducts(shopId: string) {
  return listProductsByShop(shopId);
}

export async function createOrSupplyProduct(body: Record<string, unknown>, shopId: string) {
  const productId = typeof body.productId === 'string' ? body.productId : '';
  const name = String(body.name ?? '').trim();
  const category = String(body.category ?? '').trim();
  const emoji = String(body.emoji ?? '📦').trim();
  const quantity = parseAmount(body.quantity);
  const purchaseTotal = Math.round(parseAmount(body.purchaseTotal));
  const sellingUnitPrice = Math.round(parseAmount(body.sellingUnitPrice));
  const unit = body.unit;

  if (!productId && (!name || !category)) {
    throw userError('Renseigne le nom et la categorie.', 400, 'PRODUCT_NAME_CATEGORY_REQUIRED');
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw userError('La quantite doit etre superieure a 0.', 400, 'QUANTITY_INVALID');
  }

  if (!Number.isFinite(purchaseTotal) || purchaseTotal < 0) {
    throw userError('Le cout achat total doit etre valide.', 400, 'PURCHASE_TOTAL_INVALID');
  }

  if (!Number.isFinite(sellingUnitPrice) || sellingUnitPrice <= 0) {
    throw userError('Le prix de vente par unite doit etre superieur a 0.', 400, 'SELLING_PRICE_INVALID');
  }

  if (!productId && !isProductUnit(unit)) {
    throw userError('Selectionne une unite valide.', 400, 'UNIT_INVALID');
  }

  const product = await saveProductSupply({
    shopId,
    productId,
    name,
    category,
    emoji,
    quantity,
    unit: unit as ProductUnit,
    purchaseTotal,
    sellingUnitPrice,
  });

  return {
    product,
    statusCode: productId ? 200 : 201,
  };
}
