import { createExpense, flushOfflineQueue, getControlErrorMessage, isOfflineQueued, type ExpenseCategory } from '@/lib/control-data';
import { useNetworkStatus } from '@/lib/network-state';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

const categories: { label: string; value: ExpenseCategory }[] = [
  { label: 'Transport', value: 'transport' },
  { label: 'Courant', value: 'courant' },
  { label: 'Sachets', value: 'sachets' },
  { label: 'Eau', value: 'eau' },
  { label: 'Salaire', value: 'salaire' },
  { label: 'Imprévu', value: 'imprevu' },
  { label: 'Nettoyage', value: 'nettoyage' },
];

function parseAmount(value: string) {
  const parsed = Number(value.replace(',', '.').trim());

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

export default function ExpenseScreen() {
  const router = useRouter();
  const isOffline = useNetworkStatus();
  const prevOfflineRef = useRef(false);
  const [category, setCategory] = useState<ExpenseCategory>('transport');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const parsedAmount = parseAmount(amount);

  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      flushOfflineQueue();
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline]);

  async function handleCreateExpense() {
    setFormError('');
    setSuccessMessage('');

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Le montant de la sortie doit etre superieur a 0.');
      return;
    }

    setSaving(true);

    try {
      const expense = await createExpense({
        category,
        amount: Math.round(parsedAmount),
        note: note.trim(),
      });

      setAmount('');
      setNote('');
      setSuccessMessage(`Sortie enregistree : ${formatMoney(expense.amount)}.`);
    } catch (error) {
      if (isOfflineQueued(error)) {
        setAmount('');
        setNote('');
        setSuccessMessage('En attente de connexion — sera synchronisée.');
      } else {
        setFormError(getControlErrorMessage(error));
      }
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
        {isOffline && (
          <View
            style={{
              backgroundColor: '#FFF3CD',
              paddingVertical: 8,
              paddingHorizontal: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Feather name="wifi-off" size={13} color="#856404" />
            <Text style={{ color: '#856404', fontSize: 13, fontWeight: '600', flex: 1 }}>
              Hors ligne — les sorties seront synchronisées à la reconnexion
            </Text>
          </View>
        )}
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
            </View>

            <View style={{ marginTop: 26, gap: 8 }}>
              <Text style={{ color: '#111111', fontSize: 34, lineHeight: 39, fontWeight: '800' }}>
                Sortie caisse
              </Text>
              <Text style={{ color: '#9A9A9A', fontSize: 15, lineHeight: 21 }}>
                Enregistre une depense payee en cash.
              </Text>
            </View>

            <View style={{ marginTop: 26, gap: 13 }}>
              <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>Categorie</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                {categories.map((item) => {
                  const selected = category === item.value;

                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setCategory(item.value)}
                      style={({ pressed }: { pressed: boolean }) => ({
                        minHeight: 38,
                        borderRadius: 19,
                        backgroundColor: selected ? '#111111' : '#F2F2F2',
                        paddingHorizontal: 14,
                        justifyContent: 'center',
                        opacity: pressed ? 0.72 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: selected ? '#FFFFFF' : '#777777',
                          fontSize: 13,
                          fontWeight: '800',
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ marginTop: 26, gap: 15 }}>
              <View style={{ gap: 7 }}>
                <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Montant</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
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
                <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Motif (optionnel)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Précision..."
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
                  backgroundColor: '#F7F7F7',
                  borderWidth: 1,
                  borderColor: '#EFEFEF',
                  padding: 18,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: '#777777', fontSize: 14, fontWeight: '700' }}>
                  A deduire de la caisse
                </Text>
                <Text
                  selectable
                  style={{
                    color: '#111111',
                    fontSize: 26,
                    lineHeight: 31,
                    fontWeight: '900',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {Number.isNaN(parsedAmount) ? '0 F' : formatMoney(parsedAmount)}
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
                onPress={handleCreateExpense}
                disabled={saving}
                style={({ pressed }: { pressed: boolean }) => ({
                  height: 54,
                  borderRadius: 20,
                  borderCurve: 'continuous',
                  backgroundColor: saving ? '#9FCAEF' : '#2A8DEB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 9,
                  opacity: pressed ? 0.76 : 1,
                })}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Feather name="minus" size={20} color="#FFFFFF" />
                )}
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                  Enregistrer la sortie
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
