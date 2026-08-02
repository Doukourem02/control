import {
  createMissing,
  getControlErrorMessage,
  getProducts,
  type MissingReason,
  type MissingRow,
  type ProductRow,
  getRecentMissings,
} from '@/lib/control-data';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { colors } from '@/lib/theme';

const reasons: { label: string; value: MissingReason }[] = [
  { label: 'Perdu', value: 'perdu' },
  { label: 'Abîmé', value: 'abime' },
  { label: 'Erreur', value: 'erreur' },
  { label: 'Conso. interne', value: 'consommation interne' },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function parseQuantity(value: string) {
  const parsed = Number(value.replace(',', '.').trim());

  return Number.isFinite(parsed) ? parsed : Number.NaN;
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

function ProductOption({
  product,
  selected,
  onPress,
}: {
  product: ProductRow;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: 66,
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: selected ? colors.gray900 : colors.gray50,
        borderWidth: 1,
        borderColor: selected ? colors.gray900 : colors.gray100,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: selected ? colors.white : colors.gray900, fontSize: 15, fontWeight: '800' }}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 3, color: selected ? colors.gray300 : colors.gray500, fontSize: 13 }}>
          {product.quantity} {product.unit} disponible
        </Text>
      </View>
    </Pressable>
  );
}

function MissingItem({ missing }: { missing: MissingRow }) {
  return (
    <View
      style={{
        minHeight: 66,
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: colors.dangerSoft,
        borderWidth: 1,
        borderColor: colors.dangerSoft,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: colors.gray900, fontSize: 15, fontWeight: '800' }}>
          {missing.productName}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 3, color: colors.gray500, fontSize: 13 }}>
          {missing.reason} · {formatDateTime(missing.$createdAt)}
        </Text>
      </View>
      <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '800' }}>
        -{missing.quantity} {missing.unit}
      </Text>
    </View>
  );
}

export default function MissingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  const historyOnly = params.view === 'history';
  const todayKey = dateToKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [recentMissings, setRecentMissings] = useState<MissingRow[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<MissingReason>('perdu');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedProduct = useMemo(
    () => products.find((p) => p.$id === selectedProductId),
    [products, selectedProductId]
  );
  const parsedQuantity = parseQuantity(quantity);

	  const loadData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
	    if (!silent) setLoading(true);

	    const [nextProducts, nextMissings] = await Promise.all([
	      getProducts(),
	      getRecentMissings(50, historyOnly ? selectedDate : undefined),
	    ]);

    setProducts(nextProducts);
    setRecentMissings(nextMissings);
    setSelectedProductId((current) =>
      nextProducts.some((p) => p.$id === current) ? current : nextProducts[0]?.$id || ''
    );

	    if (!silent) setLoading(false);
	  }, [historyOnly, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateMissing() {
    setFormError('');
    setSuccessMessage('');

    if (!selectedProduct) {
      setFormError('Ajoute un produit en stock avant de declarer un manquant.');
      return;
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setFormError('La quantite doit etre superieure a 0.');
      return;
    }

    if (parsedQuantity > selectedProduct.quantity) {
      setFormError('Stock insuffisant pour cette quantite.');
      return;
    }

    setSaving(true);

    try {
      await createMissing({
        productId: selectedProduct.$id,
        quantity: parsedQuantity,
        reason,
        note: note.trim(),
      });

      setQuantity('');
      setNote('');
      setSuccessMessage(
        `Manquant enregistre : ${selectedProduct.name} - ${parsedQuantity} ${selectedProduct.unit}.`
      );
      await loadData({ silent: true });
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
                onPress={loadData}
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
                {historyOnly ? 'Historique' : 'Manquant'}
              </Text>
              <Text style={{ color: colors.gray500, fontSize: 15, lineHeight: 21 }}>
                {historyOnly
                  ? 'Retrouve les pertes et casses par date.'
                  : selectedProduct
                    ? `Declare une perte ou casse pour ${selectedProduct.name}.`
                    : 'Declare une perte, casse ou erreur de stock.'}
              </Text>
            </View>

            {historyOnly ? (
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
                  onPress={() => setSelectedDate((current) => shiftDateKey(current, -1))}
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
                  {formatBusinessDate(selectedDate)}
                </Text>
                <Pressable
                  disabled={selectedDate === todayKey}
                  onPress={() => setSelectedDate((current) => shiftDateKey(current, 1))}
                  style={({ pressed }: { pressed: boolean }) => ({
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: selectedDate === todayKey ? 0.28 : pressed ? 0.62 : 1,
                  })}
                >
                  <Feather name="chevron-right" size={22} color={colors.gray600} />
                </Pressable>
              </View>
            ) : null}

            {!historyOnly ? (
              <>
                <View style={{ marginTop: 26, gap: 13 }}>
                  <Text style={{ color: colors.gray900, fontSize: 18, fontWeight: '800' }}>Produit</Text>

                  {loading ? (
                    <View style={{ paddingVertical: 22, alignItems: 'center' }}>
                      <ActivityIndicator color={colors.danger} />
                    </View>
                  ) : products.length === 0 ? (
                    <View
                      style={{
                        minHeight: 86,
                        borderRadius: 16,
                        borderCurve: 'continuous',
                        backgroundColor: colors.gray50,
                        borderWidth: 1,
                        borderColor: colors.gray100,
                        padding: 18,
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: colors.gray900, fontSize: 16, fontWeight: '800' }}>
                        Aucun stock
                      </Text>
                      <Text style={{ marginTop: 5, color: colors.gray500, fontSize: 14 }}>
                        Ajoute un produit avant de declarer un manquant.
                      </Text>
                    </View>
                  ) : (
                    products.map((product) => (
                      <ProductOption
                        key={product.$id}
                        product={product}
                        selected={product.$id === selectedProductId}
                        onPress={() => setSelectedProductId(product.$id)}
                      />
                    ))
                  )}
                </View>

                <View style={{ marginTop: 26, gap: 13 }}>
                  <Text style={{ color: colors.gray900, fontSize: 18, fontWeight: '800' }}>Raison</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                    {reasons.map((item) => {
                      const selected = reason === item.value;

                      return (
                        <Pressable
                          key={item.value}
                          onPress={() => setReason(item.value)}
                          style={({ pressed }: { pressed: boolean }) => ({
                            minHeight: 38,
                            borderRadius: 19,
                            backgroundColor: selected ? colors.danger : colors.gray100,
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
                    <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600' }}>Quantite</Text>
                    <TextInput
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="0"
                      placeholderTextColor={colors.gray400}
                      keyboardType="decimal-pad"
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
                    <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600' }}>
                      Note (optionnel)
                    </Text>
                    <TextInput
                      value={note}
                      onChangeText={setNote}
                      placeholder="Detail ou contexte..."
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

                  {formError ? (
                    <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>
                      {formError}
                    </Text>
                  ) : null}

                  {successMessage ? (
                    <Text style={{ color: colors.successMuted, fontSize: 13, fontWeight: '700' }}>
                      {successMessage}
                    </Text>
                  ) : null}

                  <Pressable
                    onPress={handleCreateMissing}
                    disabled={saving}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: 54,
                      borderRadius: 16,
                      borderCurve: 'continuous',
                      backgroundColor: saving ? colors.dangerDark : colors.danger,
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
                      <Feather name="alert-triangle" size={20} color={colors.white} />
                    )}
                    <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>
                      Declarer le manquant
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {historyOnly ? (
              <View style={{ marginTop: 26, gap: 13 }}>
                <Text style={{ color: colors.gray900, fontSize: 18, fontWeight: '800' }}>
                  Historique du {formatBusinessDate(selectedDate)}
                </Text>

                {loading ? (
                  <View style={{ paddingVertical: 22, alignItems: 'center' }}>
                    <ActivityIndicator color={colors.danger} />
                  </View>
                ) : recentMissings.length === 0 ? (
                  <View
                    style={{
                      minHeight: 78,
                      borderRadius: 16,
                      borderCurve: 'continuous',
                      backgroundColor: colors.gray50,
                      borderWidth: 1,
                      borderColor: colors.gray100,
                      padding: 18,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: colors.gray900, fontSize: 16, fontWeight: '800' }}>
                      Aucun manquant enregistre
                    </Text>
                    <Text style={{ marginTop: 5, color: colors.gray500, fontSize: 14 }}>
                      Les pertes et manquants de cette date apparaitront ici.
                    </Text>
                  </View>
                ) : (
                  recentMissings.map((missing) => (
                    <MissingItem key={missing.$id} missing={missing} />
                  ))
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
