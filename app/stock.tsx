import {
  createProduct,
  getProducts,
  type ProductRow,
  type ProductUnit,
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

const units: { label: string; value: ProductUnit }[] = [
  { label: 'kg', value: 'kg' },
  { label: 'piece', value: 'piece' },
  { label: 'carton', value: 'carton' },
  { label: 'tas', value: 'tas' },
  { label: 'unite', value: 'unite' },
];

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function parseAmount(value: string) {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B4B4B4"
        keyboardType={keyboardType}
        style={{
          minHeight: 52,
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
  );
}

function ProductItem({ product }: { product: ProductRow }) {
  return (
    <View
      style={{
        minHeight: 76,
        borderRadius: 22,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: '#111111', fontSize: 16, fontWeight: '800' }}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 4, color: '#9A9A9A', fontSize: 13 }}>
          {product.category}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={{ color: '#111111', fontSize: 16, fontWeight: '800' }}>
          {product.quantity} {product.unit}
        </Text>
        <Text style={{ color: '#2A8DEB', fontSize: 13, fontWeight: '700' }}>
          {formatMoney(product.sellingUnitPrice)}
        </Text>
      </View>
    </View>
  );
}

export default function StockScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('kg');
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState('');
  const [sellingUnitPrice, setSellingUnitPrice] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const nextProducts = await getProducts();
    setProducts(nextProducts);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleCreateProduct() {
    setFormError('');

    const parsedQuantity = parseAmount(quantity);
    const parsedPurchasePrice = parseAmount(purchaseUnitPrice);
    const parsedSellingPrice = parseAmount(sellingUnitPrice);

    if (!name.trim() || !category.trim()) {
      setFormError('Renseigne le nom et la categorie.');
      return;
    }

    if (parsedQuantity <= 0 || Number.isNaN(parsedQuantity)) {
      setFormError('La quantite doit etre superieure a 0.');
      return;
    }

    if (parsedPurchasePrice < 0 || parsedSellingPrice <= 0 || Number.isNaN(parsedSellingPrice)) {
      setFormError('Verifie les prix achat et vente.');
      return;
    }

    setSaving(true);

    try {
      await createProduct({
        name,
        category,
        quantity: parsedQuantity,
        unit,
        purchaseUnitPrice: Math.round(parsedPurchasePrice),
        sellingUnitPrice: Math.round(parsedSellingPrice),
      });

      setName('');
      setCategory('');
      setQuantity('');
      setUnit('kg');
      setPurchaseUnitPrice('');
      setSellingUnitPrice('');
      await loadProducts();
    } catch (error) {
      console.warn('Unable to create product.', error);
      setFormError('Impossible d’enregistrer le produit pour le moment.');
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
                Stock
              </Text>
              <Text style={{ color: '#9A9A9A', fontSize: 15, lineHeight: 21 }}>
                {products.length} produit{products.length > 1 ? 's' : ''} en boutique
              </Text>
            </View>

            <View style={{ marginTop: 26, gap: 15 }}>
              <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>
                Ajouter un produit
              </Text>

              <Field label="Nom" value={name} onChangeText={setName} placeholder="Riz, huile, savon" />
              <Field
                label="Categorie"
                value={category}
                onChangeText={setCategory}
                placeholder="Alimentaire, hygiene"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Quantite"
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1, gap: 7 }}>
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Unite</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                    {units.map((item) => {
                      const selected = unit === item.value;

                      return (
                        <Pressable
                          key={item.value}
                          onPress={() => setUnit(item.value)}
                          style={({ pressed }: { pressed: boolean }) => ({
                            minHeight: 32,
                            borderRadius: 16,
                            backgroundColor: selected ? '#111111' : '#F2F2F2',
                            paddingHorizontal: 11,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Text
                            style={{
                              color: selected ? '#FFFFFF' : '#777777',
                              fontSize: 12,
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
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Prix achat"
                    value={purchaseUnitPrice}
                    onChangeText={setPurchaseUnitPrice}
                    placeholder="0 F"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Prix vente"
                    value={sellingUnitPrice}
                    onChangeText={setSellingUnitPrice}
                    placeholder="0 F"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {formError ? (
                <Text style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>{formError}</Text>
              ) : null}

              <Pressable
                onPress={handleCreateProduct}
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
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="plus" size={20} color="#FFFFFF" />}
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                  Enregistrer
                </Text>
              </Pressable>
            </View>

            <View style={{ marginTop: 30, gap: 13 }}>
              <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>
                Produits
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
                    Aucun produit
                  </Text>
                  <Text style={{ marginTop: 5, color: '#9A9A9A', fontSize: 14 }}>
                    Ajoute le premier stock de la boutique.
                  </Text>
                </View>
              ) : (
                products.map((product) => <ProductItem key={product.$id} product={product} />)
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
