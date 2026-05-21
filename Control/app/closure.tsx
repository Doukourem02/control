import {
  createCashClosure,
  getControlErrorMessage,
  getTodaySummary,
  type TodaySummary,
} from '@/lib/control-data';
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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function parseAmount(value: string) {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return Number.NaN;

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function ClosureSummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View
      style={{
        minHeight: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <Text style={{ flex: 1, color: '#777777', fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          maxWidth: '52%',
          color: muted ? '#9A9A9A' : '#111111',
          fontSize: 14,
          fontWeight: '900',
          textAlign: 'right',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

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
  const [physicalCashAmount, setPhysicalCashAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const hasPhysicalCashInput = physicalCashAmount.trim().length > 0;
  const parsedPhysicalCash = parseAmount(physicalCashAmount);
  const canCalculateGap = hasPhysicalCashInput && !Number.isNaN(parsedPhysicalCash);
  const cashGap = canCalculateGap ? parsedPhysicalCash - summary.physicalCashExpected : 0;
  const closureStatusText = summary.isClosed
    ? summary.latestCashGap === 0
      ? 'Journee deja cloturee sans ecart.'
      : `Journee deja cloturee avec un ecart de ${formatMoney(summary.latestCashGap)}.`
    : 'Journee ouverte : compte le cash pour cloturer.';
  const closureStatusColor = summary.isClosed
    ? summary.latestCashGap === 0
      ? '#34C875'
      : '#E5484D'
    : '#FF8A4C';

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
    setPhysicalCashAmount('');
    setNote('');
    setFormError('');
    setSuccessMessage('');
  }, [businessDate]);

  async function handleCreateClosure() {
    setFormError('');
    setSuccessMessage('');

    if (!hasPhysicalCashInput) {
      setFormError('Renseigne le cash compte avant de cloturer.');
      return;
    }

    if (Number.isNaN(parsedPhysicalCash) || parsedPhysicalCash < 0) {
      setFormError('Le montant compte doit etre valide.');
      return;
    }

    setSaving(true);

    try {
      const closure = await createCashClosure({
        businessDate,
        physicalCashAmount: Math.round(parsedPhysicalCash),
        note: note.trim(),
      });

      setSuccessMessage(
        closure.cashGap === 0
          ? `Caisse cloturee : ${formatMoney(closure.physicalCashActual)} comptes, aucun ecart.`
          : `Caisse cloturee : ecart ${formatMoney(closure.cashGap)}.`
      );
      await loadSummary({ silent: true });
    } catch (error) {
      setFormError(getControlErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
                  backgroundColor: '#F7F7F7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.62 : 1,
                })}
              >
                <Feather name="arrow-left" size={21} color="#111111" />
              </Pressable>
              <Pressable
                onPress={loadSummary}
                style={({ pressed }: { pressed: boolean }) => ({
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#F7F7F7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.62 : 1,
                })}
              >
                <Feather name="refresh-cw" size={18} color="#777777" />
              </Pressable>
            </View>

            <View style={{ marginTop: 26, gap: 8 }}>
              <Text style={{ color: '#111111', fontSize: 34, lineHeight: 39, fontWeight: '800' }}>
                Cloture
              </Text>
              <Text style={{ color: '#9A9A9A', fontSize: 15, lineHeight: 21 }}>
                Compte le cash present dans la caisse.
              </Text>
            </View>

            <View
              style={{
                marginTop: 22,
                minHeight: 52,
                borderRadius: 20,
                borderCurve: 'continuous',
                backgroundColor: '#F7F7F7',
                borderWidth: 1,
                borderColor: '#EEEEEE',
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
                <Feather name="chevron-left" size={22} color="#777777" />
              </Pressable>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ flex: 1, color: '#111111', fontSize: 16, fontWeight: '800', textAlign: 'center' }}
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
                <Feather name="chevron-right" size={22} color="#777777" />
              </Pressable>
            </View>

            <View
              style={{
                marginTop: 12,
                minHeight: 54,
                borderRadius: 20,
                borderCurve: 'continuous',
                backgroundColor: '#F7F7F7',
                borderWidth: 1,
                borderColor: '#EEEEEE',
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
              <Text numberOfLines={2} style={{ flex: 1, color: '#777777', fontSize: 13, fontWeight: '700' }}>
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
                backgroundColor: '#F7F7F7',
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                opacity: pressed ? 0.64 : 1,
              })}
            >
              <Feather name="clock" size={16} color="#777777" />
              <Text style={{ color: '#111111', fontSize: 13, fontWeight: '800' }}>Voir les clotures</Text>
            </Pressable>

            {loading ? (
              <View style={{ paddingVertical: 34, alignItems: 'center' }}>
                <ActivityIndicator color="#2A8DEB" />
              </View>
            ) : (
              <View style={{ marginTop: 26, gap: 15 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View
                    style={{
                      flex: 1,
                      minHeight: 86,
                      borderRadius: 24,
                      borderCurve: 'continuous',
                      backgroundColor: '#F7F7F7',
                      borderWidth: 1,
                      borderColor: '#EFEFEF',
                      padding: 16,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: '#777777', fontSize: 13, fontWeight: '700' }}>
                      Cash attendu
                    </Text>
                    <Text
                      selectable
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{
                        color: '#111111',
                        fontSize: 22,
                        fontWeight: '900',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatMoney(summary.physicalCashExpected)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      minHeight: 86,
                      borderRadius: 24,
                      borderCurve: 'continuous',
                      backgroundColor: '#F7F7F7',
                      borderWidth: 1,
                      borderColor: '#EFEFEF',
                      padding: 16,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: '#777777', fontSize: 13, fontWeight: '700' }}>
                      Dernier ecart
                    </Text>
                    <Text
                      selectable
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{
                        color: summary.latestCashGap === 0 ? '#111111' : '#E5484D',
                        fontSize: 22,
                        fontWeight: '900',
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatMoney(summary.latestCashGap)}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 7 }}>
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>
                    Cash compte
                  </Text>
                  <TextInput
                    value={physicalCashAmount}
                    onChangeText={setPhysicalCashAmount}
                    placeholder="0 F"
                    placeholderTextColor="#B4B4B4"
                    keyboardType="number-pad"
                    style={{
                      minHeight: 54,
                      borderRadius: 18,
                      borderCurve: 'continuous',
                      backgroundColor: '#F7F7F7',
                      borderWidth: 1,
                      borderColor: '#EEEEEE',
                      paddingHorizontal: 16,
                      color: '#111111',
                      fontSize: 18,
                      fontWeight: '800',
                    }}
                  />
                </View>

                <View style={{ gap: 7 }}>
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Note</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Commentaire de fin de journee"
                    placeholderTextColor="#B4B4B4"
                    style={{
                      minHeight: 54,
                      borderRadius: 18,
                      borderCurve: 'continuous',
                      backgroundColor: '#F7F7F7',
                      borderWidth: 1,
                      borderColor: '#EEEEEE',
                      paddingHorizontal: 16,
                      color: '#111111',
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  />
                </View>

                <View
                  style={{
                    borderRadius: 24,
                    borderCurve: 'continuous',
                    backgroundColor: '#F7F7F7',
                    borderWidth: 1,
                    borderColor: '#EFEFEF',
                    padding: 18,
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <Feather name="clipboard" size={17} color="#777777" />
                    <Text style={{ color: '#111111', fontSize: 16, fontWeight: '900' }}>
                      Resume avant confirmation
                    </Text>
                  </View>

                  <View style={{ gap: 2 }}>
                    <ClosureSummaryRow
                      label="Ventes cash"
                      value={formatMoney(summary.cashSalesAmount)}
                    />
                    <ClosureSummaryRow
                      label="Sorties caisse"
                      value={summary.expensesAmount === 0 ? formatMoney(0) : `-${formatMoney(summary.expensesAmount)}`}
                      muted={summary.expensesAmount === 0}
                    />
                    <ClosureSummaryRow
                      label="Cash attendu en caisse"
                      value={formatMoney(summary.physicalCashExpected)}
                    />
                    <ClosureSummaryRow
                      label="Mobile Money suivi"
                      value={formatMoney(summary.mobileMoneySalesAmount)}
                      muted
                    />
                  </View>

                  {summary.closureCount > 0 ? (
                    <Text style={{ color: '#E5484D', fontSize: 12, lineHeight: 17, fontWeight: '700' }}>
                      {summary.closureCount === 1
                        ? 'Une cloture existe deja pour cette journee.'
                        : `${summary.closureCount} clotures existent deja pour cette journee.`}
                    </Text>
                  ) : null}
                </View>

                <View
                  style={{
                    minHeight: 82,
                    borderRadius: 24,
                    borderCurve: 'continuous',
                    backgroundColor: !canCalculateGap || cashGap === 0 ? '#F7F7F7' : '#FFF5F5',
                    borderWidth: 1,
                    borderColor: !canCalculateGap || cashGap === 0 ? '#EFEFEF' : '#FFD7D9',
                    padding: 18,
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ color: '#777777', fontSize: 14, fontWeight: '700' }}>
                    Ecart calcule
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: !canCalculateGap ? '#A4A4A4' : cashGap === 0 ? '#111111' : '#E5484D',
                      fontSize: canCalculateGap ? 26 : 18,
                      lineHeight: 31,
                      fontWeight: canCalculateGap ? '900' : '700',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {canCalculateGap ? formatMoney(cashGap) : 'En attente du cash compte'}
                  </Text>
                </View>

                {formError ? (
                  <Text selectable style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>
                    {formError}
                  </Text>
                ) : null}

                {successMessage ? (
                  <Text selectable style={{ color: '#2A8D55', fontSize: 13, fontWeight: '700' }}>
                    {successMessage}
                  </Text>
                ) : null}

                <Pressable
                  onPress={handleCreateClosure}
                  disabled={saving || !canCalculateGap || parsedPhysicalCash < 0}
                  style={({ pressed }: { pressed: boolean }) => ({
                    height: 54,
                    borderRadius: 20,
                    borderCurve: 'continuous',
                    backgroundColor: saving || !canCalculateGap || parsedPhysicalCash < 0 ? '#9FCAEF' : '#2A8DEB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 9,
                    opacity: pressed && canCalculateGap ? 0.76 : 1,
                  })}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Feather name="check-circle" size={20} color="#FFFFFF" />
                  )}
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                    Cloturer la caisse
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
