import { Card, ChoicePill, PrimaryButton, SectionTitle } from '@/components/seller-ui';
import { ScreenShell } from '@/components/screen-shell';
import { useStockStore } from '@/components/stock-store';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

const expenseTypes = ['Employés', 'Courant', 'Eau', 'Glace', 'Imprévu'];

function toNumber(value: string) {
  return Number(value.replace(/\s/g, '').replace(',', '.')) || 0;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

export function ExpenseScreen() {
  const { expenses, todayExpensesAmount, addExpense } = useStockStore();
  const [selectedType, setSelectedType] = useState(expenseTypes[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const expenseAmount = toNumber(amount);
  const canSave = expenseAmount > 0 && note.trim().length > 0;

  function handleSaveExpense() {
    if (!canSave) {
      return;
    }

    addExpense({
      type: selectedType,
      amount: expenseAmount,
      note: note.trim(),
    });

    setAmount('');
    setNote('');
  }

  return (
    <ScreenShell title="Dépense" subtitle="Renseigner uniquement l’argent réellement sorti">
      <Card accent="#FFF1E8">
        <Text style={{ color: '#7A2F13', fontSize: 16, fontWeight: '800' }}>
          Dépenses du jour
        </Text>
        <Text style={{ color: '#3A1B0E', fontSize: 36, fontWeight: '900' }}>
          {formatMoney(todayExpensesAmount)}
        </Text>
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Raccourcis</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {expenseTypes.map((type) => (
            <ChoicePill
              key={type}
              label={type}
              active={selectedType === type}
              onPress={() => setSelectedType(type)}
            />
          ))}
        </View>
      </View>

      <Card>
        <SectionTitle>Montant</SectionTitle>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Ex: 2 000 F"
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
          placeholder="Ex: paiement employé, facture du mois..."
          placeholderTextColor="#8F8A85"
          style={{ color: '#171717', fontSize: 17, fontWeight: '700' }}
        />
      </Card>

      <PrimaryButton
        title="Valider la dépense"
        icon="receipt-text-check-outline"
        disabled={!canSave}
        onPress={handleSaveExpense}
      />

      <View style={{ gap: 10 }}>
        <SectionTitle>Dernières dépenses</SectionTitle>
        {expenses.length === 0 ? (
          <Card>
            <Text style={{ color: '#777777', fontSize: 16, fontWeight: '800', lineHeight: 22 }}>
              Aucune dépense enregistrée pour l’instant.
            </Text>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: '#171717', fontSize: 17, fontWeight: '900' }}>
                    {expense.type}
                  </Text>
                  <Text style={{ color: '#777777', fontSize: 14, fontWeight: '800' }}>
                    {expense.note}
                  </Text>
                </View>
                <Text
                  style={{
                    color: '#E85D2A',
                    fontSize: 17,
                    fontWeight: '900',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatMoney(expense.amount)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScreenShell>
  );
}
