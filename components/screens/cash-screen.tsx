import { Card, InfoRow, PrimaryButton, SectionTitle } from '@/components/seller-ui';
import { ScreenShell } from '@/components/screen-shell';
import { useStockStore } from '@/components/stock-store';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

function toNumber(value: string) {
  return Number(value.replace(/\s/g, '').replace(',', '.')) || 0;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

export function CashScreen() {
  const {
    todaySalesAmount,
    todayExpensesAmount,
    expectedCashAmount,
    cashClosings,
    addCashClosing,
  } = useStockStore();
  const [realAmount, setRealAmount] = useState('');
  const [note, setNote] = useState('');
  const cashAmount = toNumber(realAmount);
  const difference = cashAmount - expectedCashAmount;
  const canClose = realAmount.trim().length > 0;
  const lastClosing = cashClosings[0];

  function handleCloseDay() {
    if (!canClose) {
      return;
    }

    addCashClosing({
      expectedAmount: expectedCashAmount,
      realAmount: cashAmount,
      note: note.trim(),
    });

    setRealAmount('');
    setNote('');
  }

  return (
    <ScreenShell title="Caisse" subtitle="Comparer l’argent attendu avec l’argent réel">
      <Card accent="#EFE7FF">
        <Text style={{ color: '#4B1D85', fontSize: 16, fontWeight: '800' }}>
          Argent attendu en caisse
        </Text>
        <Text style={{ color: '#251137', fontSize: 40, fontWeight: '900' }}>
          {formatMoney(expectedCashAmount)}
        </Text>
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Détail</SectionTitle>
        <InfoRow
          label="Ventes enregistrées"
          value={formatMoney(todaySalesAmount)}
          icon="cash-register"
          accent="#20A36A"
        />
        <InfoRow
          label="Dépenses déclarées"
          value={formatMoney(todayExpensesAmount)}
          icon="receipt-text-outline"
          accent="#E85D2A"
        />
        <InfoRow
          label="Écart actuel"
          value={canClose ? formatMoney(difference) : 'À venir'}
          icon="scale-balance"
          accent={difference === 0 ? '#0F766E' : '#DC2626'}
        />
      </View>

      <Card>
        <SectionTitle>Argent réel en caisse</SectionTitle>
        <TextInput
          value={realAmount}
          onChangeText={setRealAmount}
          placeholder="Entrer le montant"
          placeholderTextColor="#8F8A85"
          keyboardType="numeric"
          style={{ color: '#171717', fontSize: 22, fontWeight: '900' }}
        />
      </Card>

      <Card>
        <SectionTitle>Note</SectionTitle>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Ex: manque monnaie, vente non saisie..."
          placeholderTextColor="#8F8A85"
          style={{ color: '#171717', fontSize: 17, fontWeight: '700' }}
        />
      </Card>

      <PrimaryButton
        title="Fermer la journée"
        icon="lock-check-outline"
        disabled={!canClose}
        onPress={handleCloseDay}
      />

      <Card>
        <SectionTitle>À quoi sert la caisse ?</SectionTitle>
        <Text style={{ color: '#777777', fontSize: 15, fontWeight: '800', lineHeight: 22 }}>
          À la fin de la journée, elle dit si l’argent réel correspond aux ventes moins les
          dépenses. S’il y a un écart, tu sais qu’il faut vérifier une vente, une dépense ou un
          montant oublié.
        </Text>
      </Card>

      {lastClosing ? (
        <InfoRow
          label="Dernière fermeture"
          value={`Écart ${formatMoney(lastClosing.difference)}`}
          icon="lock-check-outline"
          accent={lastClosing.difference === 0 ? '#0F766E' : '#DC2626'}
        />
      ) : null}
    </ScreenShell>
  );
}
