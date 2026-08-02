import {
  createCashClosure,
  getControlErrorMessage,
  getTodaySummary,
  type TodaySummary,
} from '@/lib/control-data';
import { ClosureForm, formatClosureMoney } from '@/components/closure-form';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateStr: string) {
  return new Date(dateStr + 'T12:00:00');
}

function formatBusinessDate(dateStr: string) {
  return dateFromKey(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function shiftDateKey(dateStr: string, offset: number) {
  const date = dateFromKey(dateStr);
  date.setDate(date.getDate() + offset);
  return dateToKey(date);
}

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

export default function ClosureScreen() {
  const router = useRouter();
  const todayKey = dateToKey(new Date());
  const [businessDate, setBusinessDate] = useState(todayKey);
  const [summary, setSummary] = useState<TodaySummary>(emptySummary);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const closureStatusText = summary.isClosed
    ? summary.latestCashGap === 0
      ? 'Journee deja cloturee.'
      : `Journee deja cloturee avec un ecart caisse de ${formatClosureMoney(summary.latestCashGap)}.`
    : 'Journee ouverte : verifie le bilan puis cloture.';
  const closureStatusColor = summary.isClosed
    ? summary.latestCashGap === 0
      ? colors.successMuted
      : colors.danger
    : colors.accentOrange;

  const loadSummary = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    const nextSummary = await getTodaySummary(businessDate);
    setSummary(nextSummary);

    if (!silent) {
      setLoading(false);
    }
  }, [businessDate]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    setNote('');
    setFormError('');
    setSuccessMessage('');
  }, [businessDate]);

  async function handleCreateClosure() {
    setFormError('');
    setSuccessMessage('');
    setSaving(true);

    try {
      const closure = await createCashClosure({
        businessDate,
        physicalCashAmount: Math.round(summary.physicalCashExpected),
        note: note.trim(),
        isPartial: false,
      });

      setSuccessMessage(`Journee cloturee : ${formatClosureMoney(closure.cashSalesAmount + closure.mobileMoneySalesAmount)} de ventes.`);
      await loadSummary({ silent: true });
    } catch (error) {
      setFormError(getControlErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 36,
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
                onPress={loadSummary}
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
                Bilan du jour
              </Text>
              <Text style={{ color: colors.gray500, fontSize: 15, lineHeight: 21 }}>
                Regarde combien la journee a fait, puis cloture.
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

            <View
              style={{
                marginTop: 12,
                minHeight: 54,
                borderRadius: 16,
                borderCurve: 'continuous',
                backgroundColor: colors.gray50,
                borderWidth: 1,
                borderColor: colors.gray100,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: closureStatusColor,
                }}
              />
              <Text numberOfLines={2} style={{ flex: 1, color: colors.gray600, fontSize: 13, fontWeight: '700' }}>
                {closureStatusText}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/closure-history' as never)}
              style={({ pressed }: { pressed: boolean }) => ({
                alignSelf: 'flex-start',
                marginTop: 12,
                minHeight: 34,
                borderRadius: 17,
                backgroundColor: colors.gray50,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                opacity: pressed ? 0.64 : 1,
              })}
            >
              <Feather name="clock" size={16} color={colors.gray600} />
              <Text style={{ color: colors.gray900, fontSize: 13, fontWeight: '800' }}>Voir les clotures</Text>
            </Pressable>

            {loading ? (
              <View style={{ paddingVertical: 34, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <ClosureForm
                summary={summary}
                note={note}
                saving={saving}
                formError={formError}
                successMessage={successMessage}
                onNoteChange={setNote}
                onSubmit={handleCreateClosure}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
