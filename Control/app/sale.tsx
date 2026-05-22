import {
  createSale,
  flushOfflineQueue,
  getControlErrorMessage,
  getProducts,
  isOfflineQueued,
  type PaymentMethod,
  type ProductRow,
} from '@/lib/control-data';
import { SaleForm } from '@/components/sale-form';
import { useControlAuth } from '@/lib/control-auth';
import { useNetworkStatus } from '@/lib/network-state';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function parseQuantity(value: string) {
  const parsed = Number(value.replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function readPaymentMethods(value?: string): PaymentMethod[] {
  const methods = (value || 'Cash,Mobile Money')
    .split(',')
    .map((method) => method.trim())
    .filter((method): method is PaymentMethod => method === 'Cash' || method === 'Mobile Money');

  return methods.length > 0 ? methods : ['Cash'];
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
  const { session } = useControlAuth();
  const isOffline = useNetworkStatus();
  const prevOfflineRef = useRef(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalInput, setTotalInput] = useState('');
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
  const autoTotal =
    selectedProduct && !Number.isNaN(parsedQuantity)
      ? parsedQuantity * selectedProduct.sellingUnitPrice
      : 0;
  const parsedTotal = parseQuantity(totalInput);
  const totalAmount = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : autoTotal;
  const availablePaymentMethods = useMemo(
    () => readPaymentMethods(session?.shop.paymentMethods),
    [session?.shop.paymentMethods]
  );

  useEffect(() => {
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0] ?? 'Cash');
    }
  }, [availablePaymentMethods, paymentMethod]);

  function handleQuantityChange(val: string) {
    setQuantity(val);
    const qty = parseQuantity(val);
    if (selectedProduct && Number.isFinite(qty) && qty > 0) {
      setTotalInput(String(Math.round(qty * selectedProduct.sellingUnitPrice)));
    } else {
      setTotalInput('');
    }
  }

  function handleProductSelect(productId: string) {
    setSelectedProductId(productId);
    setFormError('');
    setSuccessMessage('');
    const product = products.find(p => p.$id === productId);
    const qty = parseQuantity(quantity);
    if (product && Number.isFinite(qty) && qty > 0) {
      setTotalInput(String(Math.round(qty * product.sellingUnitPrice)));
    } else {
      setTotalInput('');
    }
  }

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

  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      flushOfflineQueue().then(() => loadProducts({ silent: true }));
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline, loadProducts]);

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
    setTotalInput('');

    setSaving(true);

    try {
      await createSale({
        productId: selectedProduct.$id,
        quantity: parsedQuantity,
        totalAmount,
        paymentMethod,
      });
      setSuccessMessage(
        `${selectedProduct.name} vendu · reste ${remainingQuantity} ${selectedProduct.unit}`
      );
      await loadProducts({ silent: true });
    } catch (error) {
      if (isOfflineQueued(error)) {
        setSuccessMessage('En attente de connexion — sera synchronisée.');
      } else {
        setProducts(prevProducts);
        setFormError(getControlErrorMessage(error));
      }
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
          {isOffline && (
            <View
              style={{
                backgroundColor: '#FFF3CD',
                paddingVertical: 8,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Feather name="wifi-off" size={13} color="#856404" />
              <Text style={{ color: '#856404', fontSize: 13, fontWeight: '600', flex: 1 }}>
                Hors ligne — les ventes seront synchronisées à la reconnexion
              </Text>
            </View>
          )}
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
                        onPress={() => handleProductSelect(product.$id)}
                      />
                    ))}
                    {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <SaleForm
            quantity={quantity}
            totalInput={totalInput}
            autoTotal={autoTotal}
            paymentMethod={paymentMethod}
            availablePaymentMethods={availablePaymentMethods}
            formError={formError}
            successMessage={successMessage}
            saving={saving}
            onQuantityChange={handleQuantityChange}
            onTotalInputChange={setTotalInput}
            onPaymentMethodChange={setPaymentMethod}
            onSubmit={handleCreateSale}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
