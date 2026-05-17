import {
  createCategory,
  createProduct,
  DEFAULT_SHOP_ID,
  deleteCategory,
  getCategories,
  getControlErrorMessage,
  getProducts,
  getRecentStockMovements,
  type CategoryRow,
  type ProductRow,
  type ProductUnit,
  type StockMovementRow,
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

type SupplyMode = 'new' | 'existing';

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
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
  const stockValue = product.quantity * product.sellingUnitPrice;

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
          {formatMoney(product.sellingUnitPrice)} / {product.unit}
        </Text>
        <Text style={{ color: '#9A9A9A', fontSize: 12, fontWeight: '600' }}>
          valeur {formatMoney(stockValue)}
        </Text>
      </View>
    </View>
  );
}

function StockMovementItem({ movement }: { movement: StockMovementRow }) {
  const label = movement.type === 'initial' ? 'Stock initial' : 'Approvisionnement';

  return (
    <View
      style={{
        minHeight: 66,
        borderRadius: 20,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>
          {movement.productName}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 4, color: '#9A9A9A', fontSize: 13 }}>
          {label} · {formatDateTime(movement.$createdAt)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Text style={{ color: '#111111', fontSize: 14, fontWeight: '800' }}>
          +{movement.quantity} {movement.unit}
        </Text>
        <Text style={{ color: '#2A8DEB', fontSize: 12, fontWeight: '700' }}>
          {formatMoney(movement.totalCost)}
        </Text>
      </View>
    </View>
  );
}

export default function StockScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [supplyMode, setSupplyMode] = useState<SupplyMode>('new');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📦');
  const [savingCategory, setSavingCategory] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('kg');
  const [purchaseTotal, setPurchaseTotal] = useState('');
  const [sellingUnitPrice, setSellingUnitPrice] = useState('');
  const parsedQuantity = parseAmount(quantity);
  const parsedPurchaseTotal = parseAmount(purchaseTotal);
  const parsedSellingPrice = parseAmount(sellingUnitPrice);
  const purchaseUnitPrice =
    parsedQuantity > 0 && parsedPurchaseTotal >= 0
      ? Math.round(parsedPurchaseTotal / parsedQuantity)
      : 0;
  const selectedProduct = products.find((product) => product.$id === selectedProductId);
  const selectedCategory = categories.find((c) => c.$id === selectedCategoryId);
  const lowStockCount = products.filter((product) => product.quantity > 0 && product.quantity <= 5).length;
  const recentSupplies = stockMovements.filter(
    (movement) => movement.type === 'initial' || movement.type === 'supply'
  );

  const loadProducts = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    const [nextProducts, nextMovements, nextCategories] = await Promise.all([
      getProducts(),
      getRecentStockMovements(),
      getCategories(),
    ]);

    setProducts(nextProducts);
    setStockMovements(nextMovements);
    setCategories(nextCategories);
    setSelectedProductId((current) =>
      nextProducts.some((product) => product.$id === current) ? current : nextProducts[0]?.$id || ''
    );

    if (!silent) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (supplyMode === 'existing' && selectedProduct) {
      setSellingUnitPrice(String(selectedProduct.sellingUnitPrice));
      setUnit(selectedProduct.unit);
    }
  }, [selectedProduct, supplyMode]);

  async function handleCreateProduct() {
    setFormError('');
    setSuccessMessage('');
    const isExistingSupply = supplyMode === 'existing';

    if (isExistingSupply && !selectedProduct) {
      setFormError('Selectionne le produit a approvisionner.');
      return;
    }

    if (!isExistingSupply && (!name.trim() || !selectedCategoryId)) {
      setFormError('Renseigne le nom et selectionne une categorie.');
      return;
    }

    if (parsedQuantity <= 0 || Number.isNaN(parsedQuantity)) {
      setFormError('La quantite doit etre superieure a 0.');
      return;
    }

    if (parsedPurchaseTotal < 0 || Number.isNaN(parsedPurchaseTotal)) {
      setFormError('Le cout achat total doit etre valide.');
      return;
    }

    if (parsedSellingPrice <= 0 || Number.isNaN(parsedSellingPrice)) {
      setFormError('Le prix de vente par unite doit etre superieur a 0.');
      return;
    }

    const now = new Date().toISOString();
    const tempProductId = isExistingSupply ? selectedProduct!.$id : `temp-${Date.now()}`;
    const tempProduct: ProductRow = {
      $id: tempProductId,
      $createdAt: isExistingSupply ? selectedProduct!.$createdAt : now,
      $updatedAt: now,
      shopId: DEFAULT_SHOP_ID,
      name: isExistingSupply ? selectedProduct!.name : name.trim(),
      category: isExistingSupply ? selectedProduct!.category : (selectedCategory?.name ?? ''),
      emoji: isExistingSupply ? selectedProduct!.emoji : (selectedCategory?.emoji ?? '📦'),
      quantity: isExistingSupply ? selectedProduct!.quantity + parsedQuantity : parsedQuantity,
      unit: isExistingSupply ? selectedProduct!.unit : unit,
      purchaseUnitPrice: purchaseUnitPrice,
      sellingUnitPrice: Math.round(parsedSellingPrice),
    };
    const tempMovement: StockMovementRow = {
      $id: `temp-movement-${Date.now()}`,
      $createdAt: now,
      $updatedAt: now,
      shopId: DEFAULT_SHOP_ID,
      productId: tempProductId,
      productName: tempProduct.name,
      type: isExistingSupply ? 'supply' : 'initial',
      quantity: parsedQuantity,
      unit: tempProduct.unit,
      unitCost: purchaseUnitPrice,
      totalCost: Math.round(parsedPurchaseTotal),
      note: '',
    };

    const prevProducts = products;
    const prevMovements = stockMovements;

    setProducts((prev) => {
      const exists = prev.some((p) => p.$id === tempProductId);
      const next = exists
        ? prev.map((p) => (p.$id === tempProductId ? tempProduct : p))
        : [...prev, tempProduct];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStockMovements((prev) => [tempMovement, ...prev]);
    setSelectedProductId(tempProductId);
    setName('');
    setSelectedCategoryId('');
    setQuantity('');
    setUnit('kg');
    setPurchaseTotal('');
    setSellingUnitPrice(isExistingSupply ? String(Math.round(parsedSellingPrice)) : '');

    setSaving(true);

    try {
      const product = await createProduct({
        productId: isExistingSupply ? selectedProduct?.$id : undefined,
        name: isExistingSupply ? selectedProduct?.name ?? '' : name,
        category: isExistingSupply ? selectedProduct?.category ?? '' : (selectedCategory?.name ?? ''),
        emoji: isExistingSupply ? selectedProduct?.emoji ?? '📦' : (selectedCategory?.emoji ?? '📦'),
        quantity: parsedQuantity,
        unit: isExistingSupply ? selectedProduct?.unit ?? unit : unit,
        purchaseTotal: Math.round(parsedPurchaseTotal),
        sellingUnitPrice: Math.round(parsedSellingPrice),
      });

      setProducts((prev) =>
        prev
          .map((p) => (p.$id === tempProductId ? product : p))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setSelectedProductId(product.$id);
      setSuccessMessage(
        isExistingSupply
          ? `${product.name} approvisionne : stock ${product.quantity} ${product.unit}.`
          : `${product.name} ajoute au stock.`
      );
      await loadProducts({ silent: true });
    } catch (error) {
      setProducts(prevProducts);
      setStockMovements(prevMovements);
      setSelectedProductId(prevProducts[0]?.$id || '');
      const message = getControlErrorMessage(error);
      console.warn('Unable to create product.', message);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const created = await createCategory({ name: newCategoryName.trim(), emoji: newCategoryEmoji });
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCategoryId(created.$id);
      setNewCategoryName('');
      setNewCategoryEmoji('📦');
      setShowAddCategory(false);
    } catch (error) {
      setFormError(getControlErrorMessage(error));
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    try {
      await deleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.$id !== categoryId));
      if (selectedCategoryId === categoryId) setSelectedCategoryId('');
    } catch (error) {
      setFormError(getControlErrorMessage(error));
    }
  }

  const EMOJI_OPTIONS = ['🐟','🥩','🐔','🐑','🐷','🦐','🥬','🍎','🍌','🌾','🫙','🥤','🍞','🥛','🥚','🧂','🥕','🧅','🌽','🫘','🍅','📦'];

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
                {products.length} produit{products.length > 1 ? 's' : ''} · {lowStockCount} stock
                {lowStockCount > 1 ? 's' : ''} faible{lowStockCount > 1 ? 's' : ''}
              </Text>
            </View>

            <View style={{ marginTop: 26, gap: 15 }}>
              <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>
                Approvisionnement
              </Text>

              <View
                style={{
                  minHeight: 44,
                  borderRadius: 18,
                  borderCurve: 'continuous',
                  backgroundColor: '#F2F2F2',
                  padding: 4,
                  flexDirection: 'row',
                  gap: 4,
                }}
              >
                {([
                  { label: 'Nouveau', value: 'new' },
                  { label: 'Existant', value: 'existing' },
                ] as { label: string; value: SupplyMode }[]).map((item) => {
                  const selected = supplyMode === item.value;

                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => {
                        setSupplyMode(item.value);
                        setFormError('');
                        setSuccessMessage('');
                      }}
                      style={({ pressed }: { pressed: boolean }) => ({
                        flex: 1,
                        borderRadius: 15,
                        backgroundColor: selected ? '#111111' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: selected ? '#FFFFFF' : '#777777',
                          fontSize: 14,
                          fontWeight: '800',
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {supplyMode === 'existing' ? (
                <View style={{ gap: 9 }}>
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>
                    Produit a augmenter
                  </Text>
                  {products.length === 0 ? (
                    <View
                      style={{
                        minHeight: 58,
                        borderRadius: 18,
                        borderCurve: 'continuous',
                        backgroundColor: '#F7F7F7',
                        borderWidth: 1,
                        borderColor: '#EEEEEE',
                        paddingHorizontal: 16,
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>
                        Aucun produit existant
                      </Text>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {products.map((product) => {
                          const selected = selectedProductId === product.$id;

                          return (
                            <Pressable
                              key={product.$id}
                              onPress={() => setSelectedProductId(product.$id)}
                              style={({ pressed }: { pressed: boolean }) => ({
                                minHeight: 46,
                                borderRadius: 18,
                                backgroundColor: selected ? '#111111' : '#F2F2F2',
                                paddingHorizontal: 14,
                                justifyContent: 'center',
                                opacity: pressed ? 0.7 : 1,
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
                                {product.name} · {product.quantity} {product.unit}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}
                </View>
              ) : (
                <>
                  <Field label="Nom" value={name} onChangeText={setName} placeholder="Poisson, boeuf, tripe" />

                  <View style={{ gap: 9 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Categorie</Text>
                      <Pressable
                        onPress={() => setShowAddCategory((v) => !v)}
                        style={({ pressed }: { pressed: boolean }) => ({
                          flexDirection: 'row', alignItems: 'center', gap: 4,
                          opacity: pressed ? 0.6 : 1,
                        })}
                      >
                        <Feather name={showAddCategory ? 'x' : 'plus'} size={14} color="#2A8DEB" />
                        <Text style={{ color: '#2A8DEB', fontSize: 13, fontWeight: '700' }}>
                          {showAddCategory ? 'Annuler' : 'Nouvelle'}
                        </Text>
                      </Pressable>
                    </View>

                    {showAddCategory ? (
                      <View style={{ gap: 8 }}>
                        <TextInput
                          value={newCategoryName}
                          onChangeText={setNewCategoryName}
                          placeholder="Nom de la categorie"
                          placeholderTextColor="#B4B4B4"
                          style={{
                            minHeight: 48, borderRadius: 16, borderCurve: 'continuous',
                            backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#EEEEEE',
                            paddingHorizontal: 14, color: '#111111', fontSize: 15, fontWeight: '600',
                          }}
                        />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            {EMOJI_OPTIONS.map((emoji) => (
                              <Pressable
                                key={emoji}
                                onPress={() => setNewCategoryEmoji(emoji)}
                                style={({ pressed }: { pressed: boolean }) => ({
                                  width: 42, height: 42, borderRadius: 14, borderCurve: 'continuous',
                                  backgroundColor: newCategoryEmoji === emoji ? '#111111' : '#F2F2F2',
                                  alignItems: 'center', justifyContent: 'center',
                                  opacity: pressed ? 0.7 : 1,
                                })}
                              >
                                <Text style={{ fontSize: 22 }}>{emoji}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </ScrollView>
                        <Pressable
                          onPress={handleAddCategory}
                          disabled={savingCategory || !newCategoryName.trim()}
                          style={({ pressed }: { pressed: boolean }) => ({
                            height: 44, borderRadius: 16, borderCurve: 'continuous',
                            backgroundColor: savingCategory || !newCategoryName.trim() ? '#C8E3F7' : '#2A8DEB',
                            alignItems: 'center', justifyContent: 'center',
                            opacity: pressed ? 0.76 : 1,
                          })}
                        >
                          {savingCategory
                            ? <ActivityIndicator color="#FFFFFF" />
                            : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>Enregistrer la categorie</Text>
                          }
                        </Pressable>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {categories.map((cat) => {
                            const selected = selectedCategoryId === cat.$id;
                            return (
                              <Pressable
                                key={cat.$id}
                                onPress={() => setSelectedCategoryId(cat.$id)}
                                style={({ pressed }: { pressed: boolean }) => ({
                                  flexDirection: 'row', alignItems: 'center', gap: 6,
                                  minHeight: 42, borderRadius: 16, borderCurve: 'continuous',
                                  backgroundColor: selected ? '#111111' : '#F2F2F2',
                                  paddingHorizontal: 12,
                                  opacity: pressed ? 0.7 : 1,
                                })}
                              >
                                <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                                <Text style={{ color: selected ? '#FFFFFF' : '#555555', fontSize: 13, fontWeight: '700' }}>
                                  {cat.name}
                                </Text>
                                {selected && (
                                  <Pressable
                                    onPress={() => handleDeleteCategory(cat.$id)}
                                    hitSlop={8}
                                    style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.5 : 0.7 })}
                                  >
                                    <Feather name="x" size={13} color="#FFFFFF" />
                                  </Pressable>
                                )}
                              </Pressable>
                            );
                          })}
                          {categories.length === 0 && (
                            <Text style={{ color: '#B4B4B4', fontSize: 13, fontWeight: '600', paddingVertical: 10 }}>
                              Aucune categorie — clique sur Nouvelle
                            </Text>
                          )}
                        </View>
                      </ScrollView>
                    )}
                  </View>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label={supplyMode === 'existing' ? 'Quantite ajoutee' : 'Quantite vendable'}
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
                      const disabled = supplyMode === 'existing';

                      return (
                        <Pressable
                          key={item.value}
                          onPress={() => {
                            if (!disabled) {
                              setUnit(item.value);
                            }
                          }}
                          style={({ pressed }: { pressed: boolean }) => ({
                            minHeight: 32,
                            borderRadius: 16,
                            backgroundColor: selected ? '#111111' : '#F2F2F2',
                            paddingHorizontal: 11,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: disabled && !selected ? 0.38 : pressed ? 0.7 : 1,
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
                    label="Cout achat total"
                    value={purchaseTotal}
                    onChangeText={setPurchaseTotal}
                    placeholder="0 F"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Vente / unite"
                    value={sellingUnitPrice}
                    onChangeText={setSellingUnitPrice}
                    placeholder="0 F"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {parsedQuantity > 0 && parsedPurchaseTotal >= 0 ? (
                <View
                  style={{
                    minHeight: 54,
                    borderRadius: 18,
                    borderCurve: 'continuous',
                    backgroundColor: '#F7F7F7',
                    borderWidth: 1,
                    borderColor: '#EEEEEE',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>
                    Achat / unite vendable
                  </Text>
                  <Text style={{ marginTop: 3, color: '#111111', fontSize: 18, fontWeight: '800' }}>
                    {formatMoney(purchaseUnitPrice)}
                  </Text>
                </View>
              ) : null}

              {formError ? (
                <Text style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>{formError}</Text>
              ) : null}

              {successMessage ? (
                <Text style={{ color: '#2A8D55', fontSize: 13, fontWeight: '700' }}>
                  {successMessage}
                </Text>
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
                  {supplyMode === 'existing' ? 'Approvisionner' : 'Enregistrer'}
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
              ) : (
                products.map((product) => <ProductItem key={product.$id} product={product} />)
              )}
            </View>

            <View style={{ marginTop: 30, gap: 13 }}>
              <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>
                Derniers approvisionnements
              </Text>

              {loading ? (
                <View style={{ paddingVertical: 22, alignItems: 'center' }}>
                  <ActivityIndicator color="#2A8DEB" />
                </View>
              ) : (
                recentSupplies.map((movement) => (
                  <StockMovementItem key={movement.$id} movement={movement} />
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
