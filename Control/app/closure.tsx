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

const emptySummary: TodaySummary = {
  cashSalesAmount: 0,
  mobileMoneySalesAmount: 0,
  expensesAmount: 0,
  physicalCashExpected: 0,
  salesCount: 0,
  expensesCount: 0,
  latestCashGap: 0,
};

export default function ClosureScreen() {
  const router = useRouter();
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

  const loadSummary = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    const nextSummary = await getTodaySummary();
    setSummary(nextSummary);

    if (!silent) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

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
        physicalCashAmount: Math.round(parsedPhysicalCash),
        note: note.trim(),
      });

      setSuccessMessage(
        closure.cashGap === 0
          ? 'Cloture enregistree : caisse equilibree.'
          : `Cloture enregistree : ecart ${formatMoney(closure.cashGap)}.`
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
                Compare la caisse comptee avec le cash attendu.
              </Text>
            </View>

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
