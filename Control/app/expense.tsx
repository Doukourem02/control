import { createExpense, flushOfflineQueue, getControlErrorMessage, isOfflineQueued, type ExpenseCategory } from '@/lib/control-data';
import { useNetworkStatus } from '@/lib/network-state';
import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

type ReceiptPhoto = { uri: string; base64: string; mimeType: string };

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
  const [receiptPhoto, setReceiptPhoto] = useState<ReceiptPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const parsedAmount = parseAmount(amount);

  async function pickReceiptPhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission refusée',
        source === 'camera'
          ? "Autorise l'accès à la caméra pour photographier un justificatif."
          : "Autorise l'accès aux photos pour joindre un justificatif."
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images',
      base64: true,
      quality: 0.5,
      allowsEditing: true,
    };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    setReceiptPhoto({
      uri: asset.uri,
      base64: asset.base64!,
      mimeType: asset.mimeType || 'image/jpeg',
    });
  }

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
        receiptPhoto: receiptPhoto ? { base64: receiptPhoto.base64, mimeType: receiptPhoto.mimeType } : undefined,
      });

      setAmount('');
      setNote('');
      setReceiptPhoto(null);
      setSuccessMessage(`Sortie enregistree : ${formatMoney(expense.amount)}.`);
    } catch (error) {
      if (isOfflineQueued(error)) {
        setAmount('');
        setNote('');
        setReceiptPhoto(null);
        setSuccessMessage('En attente de connexion — sera synchronisée.');
      } else {
        setFormError(getControlErrorMessage(error));
      }
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
        {isOffline && (
          <View
            style={{
              backgroundColor: colors.warningSoft,
              paddingVertical: 8,
              paddingHorizontal: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Feather name="wifi-off" size={13} color={colors.warningDark} />
            <Text style={{ color: colors.warningDark, fontSize: 13, fontWeight: '600', flex: 1 }}>
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
                  backgroundColor: colors.gray50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.62 : 1,
                })}
              >
                <Feather name="arrow-left" size={21} color={colors.gray900} />
              </Pressable>
            </View>

            <View style={{ marginTop: 26, gap: 8 }}>
              <Text style={{ color: colors.gray900, fontSize: 34, lineHeight: 39, fontWeight: '800' }}>
                Sortie caisse
              </Text>
              <Text style={{ color: colors.gray500, fontSize: 15, lineHeight: 21 }}>
                Enregistre une depense payee en cash.
              </Text>
            </View>

            <View style={{ marginTop: 26, gap: 13 }}>
              <Text style={{ color: colors.gray900, fontSize: 18, fontWeight: '800' }}>Categorie</Text>
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
                        backgroundColor: selected ? colors.gray900 : colors.gray100,
                        paddingHorizontal: 14,
                        justifyContent: 'center',
                        opacity: pressed ? 0.72 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: selected ? colors.white : colors.gray600,
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
                <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600' }}>Montant</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0 F"
                  placeholderTextColor={colors.gray400}
                  keyboardType="number-pad"
                  style={{
                    minHeight: 54,
                    borderRadius: 18,
                    borderCurve: 'continuous',
                    backgroundColor: colors.gray50,
                    borderWidth: 1,
                    borderColor: colors.gray100,
                    paddingHorizontal: 16,
                    color: colors.gray900,
                    fontSize: 18,
                    fontWeight: '800',
                  }}
                />
              </View>

              <View style={{ gap: 7 }}>
                <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600' }}>Motif (optionnel)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Précision..."
                  placeholderTextColor={colors.gray400}
                  style={{
                    minHeight: 54,
                    borderRadius: 18,
                    borderCurve: 'continuous',
                    backgroundColor: colors.gray50,
                    borderWidth: 1,
                    borderColor: colors.gray100,
                    paddingHorizontal: 16,
                    color: colors.gray900,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                />
              </View>

              <View style={{ gap: 7 }}>
                <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600' }}>
                  Photo justificative (optionnel)
                </Text>
                {receiptPhoto ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Image
                      source={{ uri: receiptPhoto.uri }}
                      style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: colors.gray100 }}
                    />
                    <Pressable
                      onPress={() => setReceiptPhoto(null)}
                      style={({ pressed }: { pressed: boolean }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        opacity: pressed ? 0.65 : 1,
                      })}
                    >
                      <Feather name="trash-2" size={15} color={colors.danger} />
                      <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>Retirer</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => pickReceiptPhoto('camera')}
                      style={({ pressed }: { pressed: boolean }) => ({
                        flex: 1,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: colors.gray50,
                        borderWidth: 1,
                        borderColor: colors.gray100,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Feather name="camera" size={15} color={colors.gray600} />
                      <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '700' }}>Caméra</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => pickReceiptPhoto('library')}
                      style={({ pressed }: { pressed: boolean }) => ({
                        flex: 1,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: colors.gray50,
                        borderWidth: 1,
                        borderColor: colors.gray100,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Feather name="image" size={15} color={colors.gray600} />
                      <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '700' }}>Galerie</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <View
                style={{
                  minHeight: 82,
                  borderRadius: 16,
                  borderCurve: 'continuous',
                  backgroundColor: colors.gray50,
                  borderWidth: 1,
                  borderColor: colors.gray100,
                  padding: 18,
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ color: colors.gray600, fontSize: 14, fontWeight: '700' }}>
                  A deduire de la caisse
                </Text>
                <Text
                  selectable
                  style={{
                    color: colors.gray900,
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
                <Text selectable style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>
                  {formError}
                </Text>
              ) : null}

              {successMessage ? (
                <Text selectable style={{ color: colors.successMuted, fontSize: 13, fontWeight: '700' }}>
                  {successMessage}
                </Text>
              ) : null}

              <Pressable
                onPress={handleCreateExpense}
                disabled={saving}
                style={({ pressed }: { pressed: boolean }) => ({
                  height: 54,
                  borderRadius: 16,
                  borderCurve: 'continuous',
                  backgroundColor: saving ? colors.primaryDisabled : colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 9,
                  opacity: pressed ? 0.76 : 1,
                })}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Feather name="minus" size={20} color={colors.white} />
                )}
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>
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
