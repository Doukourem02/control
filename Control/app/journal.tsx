import {
  getAnalytics,
  getCashClosures,
  getRecentMissings,
  getTodaySummary,
  type AnalyticsTransaction,
  type CashClosureRow,
  type MissingRow,
  type TodaySummary,
} from '@/lib/control-data';
import Feather from '@expo/vector-icons/Feather';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/theme';

type JournalEntry =
  | {
      id: string;
      date: string;
      kind: 'sale';
      title: string;
      subtitle: string;
      amount: number;
    }
  | {
      id: string;
      date: string;
      kind: 'expense';
      title: string;
      subtitle: string;
      amount: number;
    }
  | {
      id: string;
      date: string;
      kind: 'missing';
      title: string;
      subtitle: string;
      quantity: string;
    }
  | {
      id: string;
      date: string;
      kind: 'closure';
      title: string;
      subtitle: string;
      amount: number;
    };

const emptySummary: TodaySummary = {
  cashSalesAmount: 0,
  mobileMoneySalesAmount: 0,
  expensesAmount: 0,
  physicalCashExpected: 0,
  salesCount: 0,
  expensesCount: 0,
  latestCashGap: 0,
  closureCount: 0,
  isClosed: false,
};

function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateStr: string) {
  return new Date(dateStr + 'T12:00:00');
}

function shiftDateKey(dateStr: string, offset: number) {
  const date = dateFromKey(dateStr);
  date.setDate(date.getDate() + offset);
  return dateToKey(date);
}

function formatBusinessDate(dateStr: string) {
  return dateFromKey(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function formatReason(value: string) {
  const labels: Record<string, string> = {
    perdu: 'Perdu',
    abime: 'Abime',
    erreur: 'Erreur',
    'consommation interne': 'Conso. interne',
  };

  return labels[value] ?? value;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 86,
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: colors.gray50,
        borderWidth: 1,
        borderColor: colors.gray100,
        padding: 16,
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: colors.gray900,
          fontSize: 21,
          fontWeight: '900',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function buildSaleEntries(transactions: AnalyticsTransaction[]): JournalEntry[] {
  return transactions.map((sale) => ({
    id: `sale-${sale.id}`,
    date: sale.date,
    kind: 'sale',
    title: sale.label,
    subtitle: sale.sub,
    amount: sale.amount,
  }));
}

function buildExpenseEntries(transactions: AnalyticsTransaction[]): JournalEntry[] {
  return transactions.map((expense) => ({
    id: `expense-${expense.id}`,
    date: expense.date,
    kind: 'expense',
    title: expense.label,
    subtitle: expense.sub || 'Sortie caisse',
    amount: -expense.amount,
  }));
}

function buildMissingEntries(missings: MissingRow[]): JournalEntry[] {
  return missings.map((missing) => ({
    id: `missing-${missing.$id}`,
    date: missing.$createdAt,
    kind: 'missing',
    title: missing.productName,
    subtitle: formatReason(missing.reason),
    quantity: `-${missing.quantity} ${missing.unit}`,
  }));
}

function buildClosureEntries(closures: CashClosureRow[]): JournalEntry[] {
  return closures.map((closure) => ({
    id: `closure-${closure.$id}`,
    date: closure.$createdAt,
    kind: 'closure',
    title: 'Cloture journee',
    subtitle: closure.cashGap === 0 ? 'Aucun ecart' : `Ecart ${formatMoney(closure.cashGap)}`,
    amount: closure.cashGap,
  }));
}

function EntryIcon({ kind }: { kind: JournalEntry['kind'] }) {
  const config = {
    sale: { icon: 'arrow-up-right' as const, color: colors.primary },
    expense: { icon: 'arrow-down-left' as const, color: colors.danger },
    missing: { icon: 'alert-triangle' as const, color: colors.warning },
    closure: { icon: 'check-circle' as const, color: colors.successMuted },
  }[kind];

  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.gray50,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name={config.icon} size={19} color={config.color} />
    </View>
  );
}

function JournalRow({ entry }: { entry: JournalEntry }) {
  const isMoneyEntry = 'amount' in entry;
  const amountColor =
    isMoneyEntry && entry.amount < 0
      ? colors.danger
      : isMoneyEntry && entry.amount > 0
        ? colors.gray900
        : colors.gray600;

  return (
    <View
      style={{
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
      }}
    >
      <EntryIcon kind={entry.kind} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: colors.gray900, fontSize: 15, fontWeight: '800' }}>
          {entry.title}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 3, color: colors.gray500, fontSize: 12, fontWeight: '600' }}>
          {formatTime(entry.date)} · {entry.subtitle}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          maxWidth: 122,
          color: amountColor,
          fontSize: 14,
          fontWeight: '900',
          textAlign: 'right',
          fontVariant: ['tabular-nums'],
        }}
      >
        {isMoneyEntry
          ? `${entry.amount > 0 ? '+' : ''}${formatMoney(entry.amount)}`
          : entry.quantity}
      </Text>
    </View>
  );
}

export default function JournalScreen() {
  const router = useRouter();
  const todayKey = dateToKey(new Date());
  const [businessDate, setBusinessDate] = useState(todayKey);
  const [summary, setSummary] = useState<TodaySummary>(emptySummary);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJournal = useCallback(async () => {
    setLoading(true);

    const [nextSummary, sales, expenses, missings, closures] = await Promise.all([
      getTodaySummary(businessDate),
      getAnalytics('sales', 1, businessDate),
      getAnalytics('expenses', 1, businessDate),
      getRecentMissings(50, businessDate),
      getCashClosures(10, businessDate),
    ]);

    const nextEntries = [
      ...buildSaleEntries(sales.transactions),
      ...buildExpenseEntries(expenses.transactions),
      ...buildMissingEntries(missings),
      ...buildClosureEntries(closures),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setSummary(nextSummary);
    setEntries(nextEntries);
    setLoading(false);
  }, [businessDate]);

  useEffect(() => {
    loadJournal();
  }, [loadJournal]);

  const totalSales = summary.cashSalesAmount + summary.mobileMoneySalesAmount;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 42,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 520 }}>
          <View
            style={{
              minHeight: 42,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.gray50,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <Feather name="arrow-left" size={21} color={colors.gray900} />
            </Pressable>
            <Pressable
              onPress={loadJournal}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.gray50,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <Feather name="refresh-cw" size={18} color={colors.gray600} />
            </Pressable>
          </View>

          <View style={{ marginTop: 26, gap: 8 }}>
            <Text style={{ color: colors.gray900, fontSize: 34, lineHeight: 39, fontWeight: '800' }}>
              Journal du jour
            </Text>
            <Text style={{ color: colors.gray500, fontSize: 15, lineHeight: 21 }}>
              Entrees, sorties, manquants et cloture.
            </Text>
          </View>

          <View
            style={{
              marginTop: 22,
              minHeight: 52,
              borderRadius: 16,
              borderCurve: 'continuous',
              backgroundColor: colors.gray50,
              borderWidth: 1,
              borderColor: colors.gray100,
              paddingHorizontal: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              onPress={() => setBusinessDate((current) => shiftDateKey(current, -1))}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <Feather name="chevron-left" size={22} color={colors.gray600} />
            </Pressable>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ flex: 1, color: colors.gray900, fontSize: 16, fontWeight: '800', textAlign: 'center' }}
            >
              {formatBusinessDate(businessDate)}
            </Text>
            <Pressable
              disabled={businessDate === todayKey}
              onPress={() => setBusinessDate((current) => shiftDateKey(current, 1))}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: businessDate === todayKey ? 0.28 : pressed ? 0.62 : 1,
              })}
            >
              <Feather name="chevron-right" size={22} color={colors.gray600} />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 42, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={{ marginTop: 20, gap: 18 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <MetricCard label="Total ventes" value={formatMoney(totalSales)} />
                <MetricCard label="Cash attendu" value={formatMoney(summary.physicalCashExpected)} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <MetricCard label="Depenses" value={formatMoney(summary.expensesAmount)} />
                <MetricCard label="Dernier ecart" value={formatMoney(summary.latestCashGap)} />
              </View>

              <View
                style={{
                  borderRadius: 16,
                  borderCurve: 'continuous',
                  backgroundColor: colors.gray50,
                  borderWidth: 1,
                  borderColor: colors.gray100,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                {entries.length > 0 ? (
                  entries.map((entry) => <JournalRow key={entry.id} entry={entry} />)
                ) : (
                  <View style={{ minHeight: 96, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.gray400, fontSize: 14, fontWeight: '700' }}>
                      Aucun mouvement pour cette date
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
