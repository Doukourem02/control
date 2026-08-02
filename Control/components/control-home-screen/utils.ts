import type { useControlAuth } from '@/lib/control-auth';
import type { StockMovementRow } from '@/lib/control-data';

export function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}
export function needsShopSetup(session: ReturnType<typeof useControlAuth>['session']) {
  if (!session) return false;

  const shopName = session.shop.name.trim();
  const ownerName = session.shop.ownerName.trim() || session.user.name.trim();

  return (
    !shopName ||
    shopName === 'Ma boutique' ||
    (!!ownerName && shopName.toLowerCase() === `boutique ${ownerName}`.toLowerCase())
  );
}
export function getInitials(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return 'C';

  return words.map((word) => word[0]?.toUpperCase()).join('');
}
export function readPaymentMethods(value?: string) {
  const methods = (value || 'Cash,Mobile Money')
    .split(',')
    .map((method) => method.trim())
    .filter(Boolean);

  return methods.length > 0 ? methods : ['Cash', 'Mobile Money'];
}
export function formatPaymentMethods(value?: string) {
  return readPaymentMethods(value).join(', ');
}
export function isAmountsVisibleByDefault(value?: string) {
  return value !== 'false';
}
export function isPreferenceEnabled(value?: string) {
  return value !== 'false';
}
export function formatLanguage(value?: string) {
  return value === 'en' ? 'English' : 'Français';
}
export function formatInviteExpiry(expiresAt?: string, createdAt?: string) {
  const expiryTime = expiresAt
    ? new Date(expiresAt).getTime()
    : createdAt
      ? new Date(createdAt).getTime() + 24 * 60 * 60 * 1000
      : 0;

  if (!expiryTime || Number.isNaN(expiryTime)) return 'Expire sous 24h';

  const diffMs = expiryTime - Date.now();
  if (diffMs <= 0) return 'Expiré';

  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (diffHours <= 1) return 'Expire dans 1h';

  return `Expire dans ${diffHours}h`;
}
export function formatUnit(value?: string) {
  const labels: Record<string, string> = {
    kg: 'kg',
    piece: 'pièce',
    carton: 'carton',
    tas: 'tas',
    unite: 'unité',
  };

  return labels[value || 'piece'] ?? 'pièce';
}
export function formatAlertsSummary(shop?: {
  stockLowAlertsEnabled?: string;
  closureReminderEnabled?: string;
  cashGapAlertsEnabled?: string;
}) {
  const enabledCount = [
    isPreferenceEnabled(shop?.stockLowAlertsEnabled),
    isPreferenceEnabled(shop?.closureReminderEnabled),
    isPreferenceEnabled(shop?.cashGapAlertsEnabled),
  ].filter(Boolean).length;

  if (enabledCount === 0) return 'Désactivées';
  return `${enabledCount} active${enabledCount > 1 ? 's' : ''}`;
}
export function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function shiftDateKey(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDayLabel(key: string): string {
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}
export async function shareExportFile(path: string, options: { mimeType: string; dialogTitle: string }) {
  try {
    const sharing = await import('expo-sharing');
    const available = await sharing.isAvailableAsync();

    if (available) {
      await sharing.shareAsync(path, options);
      return;
    }
  } catch {
    // The current development build may not include ExpoSharing yet.
  }

  throw new Error('Partage indisponible dans ce build. Rebuild le development build pour activer expo-sharing.');
}
export function getLabelIndices(count: number): number[] {
  if (count === 0) return [];
  if (count <= 4) return Array.from({ length: count }, (_, i) => i);
  return [0, Math.floor((count - 1) * 0.33), Math.floor((count - 1) * 0.66), count - 1];
}
export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
}
export function formatTooltipDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' });
}
export function formatReportDate(dateStr?: string) {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  return d.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' });
}
export function formatSectionDate(dateStr?: string) {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function formatStockMovementDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  return d
    .toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', ' à');
}
export function getStockMovementLabel(type: StockMovementRow['type']) {
  switch (type) {
    case 'initial':
      return 'Stock initial';
    case 'supply':
      return 'Approvisionnement';
    case 'sale':
      return 'Vente';
    case 'missing':
      return 'Manquant';
    default:
      return 'Ajustement';
  }
}
export function formatGreetingDate(date: Date = new Date()): string {
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
export function formatCalendarMonth(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
export function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export function dateFromKey(dateStr: string) {
  return new Date(dateStr + 'T12:00:00');
}
export function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
}
export function buildCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12));
  }

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}
