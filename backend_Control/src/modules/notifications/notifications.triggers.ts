import { getShopById } from '../shops/shops.repository';
import { createNotification, listNotifications } from './notifications.repository';

function zeroPad(n: number) {
  return String(n).padStart(2, '0');
}

function todayKey(now: Date) {
  return `${now.getFullYear()}-${zeroPad(now.getMonth() + 1)}-${zeroPad(now.getDate())}`;
}

export async function triggerStockLowAlert(
  shopId: string,
  productName: string,
  previousQuantity: number,
  newQuantity: number
): Promise<void> {
  const shop = await getShopById(shopId);
  if (!shop || shop.stockLowAlertsEnabled !== 'true') return;

  const threshold = parseInt(shop.defaultLowStockThreshold, 10) || 5;

  // Only notify when the quantity crosses the threshold, not on every sale below it
  if (previousQuantity <= threshold || newQuantity > threshold) return;

  await createNotification(
    shopId,
    'stock_low',
    'Stock faible',
    `Le stock de "${productName}" est bas (${newQuantity} ${newQuantity > 1 ? 'restants' : 'restant'}). Pense à réapprovisionner.`
  );
}

/**
 * Anomalie de stock : une seule sortie (manquant/perte) qui retire d'un coup
 * une grosse part du stock restant. Ce n'est pas "stock faible" (qui se
 * declenche sur le niveau final) mais un signal sur l'ampleur du mouvement
 * lui-meme — potentiellement une erreur de saisie ou un vol.
 */
export async function triggerStockAnomalyAlert(
  shopId: string,
  productName: string,
  removedQuantity: number,
  previousQuantity: number
): Promise<void> {
  const shop = await getShopById(shopId);
  if (!shop || shop.stockLowAlertsEnabled !== 'true') return;

  const MIN_STOCK_FOR_CHECK = 5;
  const ANOMALY_RATIO = 0.5;

  if (previousQuantity < MIN_STOCK_FOR_CHECK) return;
  if (removedQuantity / previousQuantity < ANOMALY_RATIO) return;

  await createNotification(
    shopId,
    'stock_anomaly',
    'Mouvement de stock inhabituel',
    `"${productName}" : ${removedQuantity} unités retirées d'un coup (sur ${previousQuantity} en stock). Vérifie que c'est correct.`
  );
}

export async function triggerCashGapAlert(
  shopId: string,
  businessDate: string,
  cashGap: number,
  currency: string
): Promise<void> {
  const shop = await getShopById(shopId);
  if (!shop || shop.cashGapAlertsEnabled !== 'true') return;
  if (cashGap === 0) return;

  const sign = cashGap > 0 ? '+' : '';
  await createNotification(
    shopId,
    'cash_gap',
    'Écart de caisse détecté',
    `La clôture du ${businessDate} présente un écart de ${sign}${cashGap} ${currency}.`
  );
}

export async function triggerClosureReminderIfNeeded(shopId: string): Promise<void> {
  const shop = await getShopById(shopId);
  if (!shop || shop.closureReminderEnabled !== 'true') return;

  const now = new Date();
  const [h, m] = (shop.defaultClosingTime || '20:00').split(':').map(Number);
  if (now.getHours() * 60 + now.getMinutes() < (h ?? 20) * 60 + (m ?? 0)) return;

  // Dedup : ne pas envoyer deux rappels dans la même fenêtre de 12h
  const recent = await listNotifications(shopId, 20);
  const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
  const alreadySent = recent.some(
    (n) => n.type === 'closure_reminder' && new Date(n.$createdAt).getTime() > twelveHoursAgo
  );
  if (alreadySent) return;

  await createNotification(
    shopId,
    'closure_reminder',
    'Clôture oubliée',
    `La journée du ${todayKey(now)} n'a pas encore été clôturée. Pense à clôturer avant de fermer.`
  );
}
