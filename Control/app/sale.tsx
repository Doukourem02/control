import {
  createSale,
  getControlErrorMessage,
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

function ProductTile({
  product,
  selected,
  onPress,
}: {
  product: ProductRow;
  selected: boolean;
  onPress: () => void;
}) {
  const emoji = product.emoji || '📦';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        flex: 1,
        aspectRatio: 1,
        borderRadius: 24,
        borderCurve: 'continuous',
        backgroundColor: selected ? '#111111' : '#F7F7F7',
        borderWidth: 1.5,
        borderColor: selected ? '#111111' : '#EFEFEF',
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Text style={{ fontSize: 34 }}>{emoji}</Text>
      <Text
        numberOfLines={2}
        style={{
          color: selected ? '#FFFFFF' : '#111111',
          fontSize: 14,
          fontWeight: '800',
          textAlign: 'center',
        }}
      >
        {product.name}
      </Text>
      <Text
        style={{
          color: selected ? '#AAAAAA' : '#2A8DEB',
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {formatMoney(product.sellingUnitPrice)} / {product.unit}
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
  const [successMessage, setSuccessMessage] = useState('');

  const selectedProduct = useMemo(
    () => products.find((product) => product.$id === selectedProductId),
    [products, selectedProductId]
  );
  const parsedQuantity = parseQuantity(quantity);
  const totalAmount =
    selectedProduct && !Number.isNaN(parsedQuantity)
      ? parsedQuantity * selectedProduct.sellingUnitPrice
      : 0;

  const loadProducts = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    const nextProducts = await getProducts();
    setProducts(nextProducts);
    setSelectedProductId((current) =>
      nextProducts.some((p) => p.$id === current) ? current : nextProducts[0]?.$id || ''
    );
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleCreateSale() {
    setFormError('');
    setSuccessMessage('');

    if (!selectedProduct) {
      setFormError('Selectionne un produit.');
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

    const prevProducts = products;
    const remainingQuantity = selectedProduct.quantity - parsedQuantity;

    setProducts((current) =>
      current.map((p) =>
        p.$id === selectedProduct.$id ? { ...p, quantity: remainingQuantity } : p
      )
    );
    setQuantity('');

    setSaving(true);

    try {
      await createSale({
        productId: selectedProduct.$id,
        quantity: parsedQuantity,
        paymentMethod,
      });
      setSuccessMessage(
        `${selectedProduct.name} vendu · reste ${remainingQuantity} ${selectedProduct.unit}`
      );
      await loadProducts({ silent: true });
    } catch (error) {
      setProducts(prevProducts);
      setFormError(getControlErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const rows: ProductRow[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 16,
            }}
          >
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

            <View style={{ marginTop: 20, marginBottom: 20 }}>
              <Text style={{ color: '#111111', fontSize: 34, lineHeight: 39, fontWeight: '800' }}>
                Vente
              </Text>
              {selectedProduct ? (
                <Text style={{ marginTop: 6, color: '#9A9A9A', fontSize: 15 }}>
                  {selectedProduct.name} · {selectedProduct.quantity} {selectedProduct.unit} en stock
                </Text>
              ) : (
                <Text style={{ marginTop: 6, color: '#9A9A9A', fontSize: 15 }}>
                  Selectionne un produit
                </Text>
              )}
            </View>

            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color="#2A8DEB" />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={{ flexDirection: 'row', gap: 12 }}>
                    {row.map((product) => (
                      <ProductTile
                        key={product.$id}
                        product={product}
                        selected={product.$id === selectedProductId}
                        onPress={() => {
                          setSelectedProductId(product.$id);
                          setFormError('');
                          setSuccessMessage('');
                        }}
                      />
                    ))}
                    {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 8,
              borderTopWidth: 1,
              borderTopColor: '#F0F0F0',
              gap: 10,
            }}
          >
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
                    height: 54,
                    borderRadius: 18,
                    borderCurve: 'continuous',
                    backgroundColor: '#F7F7F7',
                    borderWidth: 1,
                    borderColor: '#EEEEEE',
                    paddingHorizontal: 16,
                    color: '#111111',
                    fontSize: 22,
                    fontWeight: '800',
                  }}
                />
              </View>

              <View style={{ flex: 1, gap: 7 }}>
                <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Paiement</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['Cash', 'Mobile Money'] as PaymentMethod[]).map((method) => {
                    const selected = paymentMethod === method;
                    return (
                      <Pressable
                        key={method}
                        onPress={() => setPaymentMethod(method)}
                        style={({ pressed }: { pressed: boolean }) => ({
                          flex: 1,
                          height: 54,
                          borderRadius: 18,
                          borderCurve: 'continuous',
                          backgroundColor: selected ? '#111111' : '#F2F2F2',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.72 : 1,
                        })}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            color: selected ? '#FFFFFF' : '#777777',
                            fontSize: 11,
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
            </View>

            <View
              style={{
                height: 58,
                borderRadius: 20,
                borderCurve: 'continuous',
                backgroundColor: '#F7F7F7',
                borderWidth: 1,
                borderColor: '#EFEFEF',
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: '#777777', fontSize: 14, fontWeight: '700' }}>Total</Text>
              <Text style={{ color: '#111111', fontSize: 24, fontWeight: '900' }}>
                {formatMoney(totalAmount)}
              </Text>
            </View>

            {formError ? (
              <Text style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>{formError}</Text>
            ) : null}

            {successMessage ? (
              <Text style={{ color: '#2A8D55', fontSize: 13, fontWeight: '700' }}>{successMessage}</Text>
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
                marginBottom: 8,
              })}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Feather name="arrow-up-right" size={20} color="#FFFFFF" />
              )}
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                Valider la vente
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
