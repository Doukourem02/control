import { Card, ChoicePill, InfoRow, SectionTitle } from '@/components/seller-ui';
import { ScreenShell } from '@/components/screen-shell';
import { useStockStore } from '@/components/stock-store';
import { Text, View } from 'react-native';

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

export function ReportScreen() {
  const {
    products,
    sales,
    expenses,
    missingStocks,
    cashClosings,
    todaySalesAmount,
    todayExpensesAmount,
    expectedCashAmount,
    totalStockKg,
    stockPurchaseValue,
  } = useStockStore();
  const restockCount = products.filter((product) => product.quantityKg <= 0).length;
  const lastClosing = cashClosings[0];

  return (
    <ScreenShell title="Bilan" subtitle="Récapitulatif réel de l’activité enregistrée">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <ChoicePill label="Aujourd’hui" active />
        <ChoicePill label="Semaine" />
        <ChoicePill label="Mois" />
        <ChoicePill label="Année" />
      </View>

      <Card accent="#EFFAF6">
        <Text style={{ color: '#367A60', fontSize: 16, fontWeight: '800' }}>
          Résultat attendu
        </Text>
        <Text style={{ color: '#0B352F', fontSize: 38, fontWeight: '900' }}>
          {formatMoney(expectedCashAmount)}
        </Text>
        <Text style={{ color: '#367A60', fontSize: 14, fontWeight: '800' }}>
          Ventes moins dépenses
        </Text>
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Activité</SectionTitle>
        <InfoRow
          label="Ventes enregistrées"
          value={`${sales.length.toLocaleString('fr-FR')} vente${sales.length > 1 ? 's' : ''} - ${formatMoney(
            todaySalesAmount,
          )}`}
          icon="cash-register"
          accent="#20A36A"
        />
        <InfoRow
          label="Dépenses déclarées"
          value={`${expenses.length.toLocaleString('fr-FR')} dépense${
            expenses.length > 1 ? 's' : ''
          } - ${formatMoney(todayExpensesAmount)}`}
          icon="receipt-text-outline"
          accent="#E85D2A"
        />
        <InfoRow
          label="Manquants signalés"
          value={`${missingStocks.length.toLocaleString('fr-FR')} signalement${
            missingStocks.length > 1 ? 's' : ''
          }`}
          icon="package-variant-closed-remove"
          accent="#DC2626"
        />
        <InfoRow
          label="Caisse fermée"
          value={lastClosing ? `Écart ${formatMoney(lastClosing.difference)}` : 'À venir'}
          icon="wallet-outline"
          accent="#7C3AED"
        />
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Stock</SectionTitle>
        <InfoRow
          label="Stock disponible"
          value={`${totalStockKg.toLocaleString('fr-FR')} kg`}
          icon="package-variant-closed"
          accent="#2563EB"
        />
        <InfoRow
          label="Valeur achat stock"
          value={formatMoney(stockPurchaseValue)}
          icon="wallet-bifold-outline"
          accent="#0F766E"
        />
        <InfoRow
          label="Produits à réapprovisionner"
          value={restockCount > 0 ? `${restockCount} produit${restockCount > 1 ? 's' : ''}` : 'À jour'}
          icon="package-variant-closed-remove"
          accent={restockCount > 0 ? '#DC2626' : '#0F766E'}
        />
      </View>
    </ScreenShell>
  );
}
