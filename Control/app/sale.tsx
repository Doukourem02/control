import {
  createSale,
  getAppwriteErrorMessage,
  getProducts,
  type PaymentMethod,
  type ProductRow,
} from '@/lib/control-data';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
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

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function parseQuantity(value: string) {
  const parsed = Number(value.replace(',', '.').trim());

  return Number.isFinite(parsed) ? parsed : Number.NaN;
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
        minHeight: 72,
        borderRadius: 22,
        borderCurve: 'continuous',
        backgroundColor: selected ? '#111111' : '#F7F7F7',
        borderWidth: 1,
        borderColor: selected ? '#111111' : '#EFEFEF',
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: selected ? '#FFFFFF' : '#111111', fontSize: 16, fontWeight: '800' }}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 4, color: selected ? '#CFCFCF' : '#9A9A9A', fontSize: 13 }}>
          {product.quantity} {product.unit} disponible
        </Text>
      </View>
      <Text style={{ color: selected ? '#FFFFFF' : '#2A8DEB', fontSize: 14, fontWeight: '800' }}>
        {formatMoney(product.sellingUnitPrice)}
      </Text>
    </Pressable>
  );
}

export default function SaleScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const selectedProduct = useMemo(
    () => products.find((product) => product.$id === selectedProductId),
    [products, selectedProductId]
  );
  const parsedQuantity = parseQuantity(quantity);
  const totalAmount =
    selectedProduct && !Number.isNaN(parsedQuantity) ? parsedQuantity * selectedProduct.sellingUnitPrice : 0;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const nextProducts = await getProducts();
    setProducts(nextProducts);
    setSelectedProductId((current) => current || nextProducts[0]?.$id || '');
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleCreateSale() {
    setFormError('');

    if (!selectedProduct) {
      setFormError('Ajoute un produit en stock avant de vendre.');
      return;
    }

    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setFormError('La quantite doit etre superieure a 0.');
      return;
    }

    if (parsedQuantity > selectedProduct.quantity) {
      setFormError('Stock insuffisant pour cette vente.');
      return;
    }

    setSaving(true);

    try {
      await createSale({
        productId: selectedProduct.$id,
        quantity: parsedQuantity,
        paymentMethod,
      });
      setQuantity('');
      await loadProducts();
    } catch (error) {
      setFormError(getAppwriteErrorMessage(error));
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
                onPress={loadProducts}
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
                Vente
              </Text>
              <Text style={{ color: '#9A9A9A', fontSize: 15, lineHeight: 21 }}>
                {selectedProduct ? `${selectedProduct.name} selectionne` : 'Aucun produit disponible'}
              </Text>
            </View>

            <View style={{ marginTop: 26, gap: 13 }}>
              <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>
                Produit
              </Text>

              {loading ? (
                <View style={{ paddingVertical: 22, alignItems: 'center' }}>
                  <ActivityIndicator color="#2A8DEB" />
                </View>
              ) : products.length === 0 ? (
                <View
                  style={{
                    minHeight: 86,
                    borderRadius: 22,
                    borderCurve: 'continuous',
                    backgroundColor: '#F7F7F7',
                    borderWidth: 1,
                    borderColor: '#EFEFEF',
                    padding: 18,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#111111', fontSize: 16, fontWeight: '800' }}>
                    Aucun stock
                  </Text>
                  <Text style={{ marginTop: 5, color: '#9A9A9A', fontSize: 14 }}>
                    Ajoute un produit avant la premiere vente.
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

            <View style={{ marginTop: 26, gap: 15 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, gap: 7 }}>
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Quantite</Text>
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="0"
                    placeholderTextColor="#B4B4B4"
                    keyboardType="decimal-pad"
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
                <View style={{ flex: 1, gap: 7 }}>
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Paiement</Text>
                  {(['Cash', 'Mobile Money'] as PaymentMethod[]).map((method) => {
                    const selected = paymentMethod === method;

                    return (
                      <Pressable
                        key={method}
                        onPress={() => setPaymentMethod(method)}
                        style={({ pressed }: { pressed: boolean }) => ({
                          minHeight: 39,
                          borderRadius: 17,
                          backgroundColor: selected ? '#111111' : '#F2F2F2',
                          paddingHorizontal: 12,
                          justifyContent: 'center',
                          opacity: pressed ? 0.72 : 1,
                        })}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: selected ? '#FFFFFF' : '#777777',
                            fontSize: 13,
                            fontWeight: '800',
                          }}
                        >
                          {method}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
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
                <Text style={{ color: '#777777', fontSize: 14, fontWeight: '700' }}>Total</Text>
                <Text style={{ color: '#111111', fontSize: 26, lineHeight: 31, fontWeight: '900' }}>
                  {formatMoney(totalAmount)}
                </Text>
              </View>

              {formError ? (
                <Text style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>
                  {formError}
                </Text>
              ) : null}

              <Pressable
                onPress={handleCreateSale}
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
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="arrow-up-right" size={20} color="#FFFFFF" />}
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>Valider la vente</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
