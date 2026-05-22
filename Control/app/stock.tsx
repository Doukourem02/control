import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getControlErrorMessage,
  getProductSupplyHistory,
  getProducts,
  updateProduct,
  type CategoryRow,
  type ProductRow,
  type ProductUnit,
  type StockMovementRow,
  type UpdateProductInput,
} from '@/lib/control-data';
import { useControlAuth } from '@/lib/control-auth';
import { logControlError } from '@/lib/control-errors';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
  { label: 'pièce', value: 'piece' },
  { label: 'carton', value: 'carton' },
  { label: 'tas', value: 'tas' },
  { label: 'unité', value: 'unite' },
];

type SupplyMode = 'new' | 'existing';

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function parseAmount(value: string) {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeProductUnit(value?: string): ProductUnit {
  return units.some((item) => item.value === value) ? (value as ProductUnit) : 'piece';
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


export default function StockScreen() {
  const router = useRouter();
  const { session } = useControlAuth();
  const scrollRef = useRef<{ scrollTo: (opts: { y: number; animated: boolean }) => void } | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
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
  const defaultUnit = normalizeProductUnit(session?.shop.defaultUnit);
  const [unit, setUnit] = useState<ProductUnit>(defaultUnit);
  const [purchaseUnitInput, setPurchaseUnitInput] = useState('');
  const [sellingUnitPrice, setSellingUnitPrice] = useState('');
  const parsedQuantity = parseAmount(quantity);
  const parsedPurchaseUnit = parseAmount(purchaseUnitInput);
  const parsedPurchaseTotal = parsedPurchaseUnit > 0 && parsedQuantity > 0
    ? Math.round(parsedPurchaseUnit * parsedQuantity)
    : 0;
  const parsedSellingPrice = parseAmount(sellingUnitPrice);
  const purchaseUnitPrice = parsedPurchaseUnit > 0 ? Math.round(parsedPurchaseUnit) : 0;
  const selectedProduct = products.find((product) => product.$id === selectedProductId);
  const selectedCategory = categories.find((c) => c.$id === selectedCategoryId);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<ProductRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<ProductRow | null>(null);
  const [newProductEmoji, setNewProductEmoji] = useState('');
  const [historyMovements, setHistoryMovements] = useState<StockMovementRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  function openRestock(product: ProductRow) {
    setSupplyMode('existing');
    setSelectedProductId(product.$id);
    setQuantity('');
    setPurchaseUnitInput('');
    setSellingUnitPrice(String(product.sellingUnitPrice));
    setFormError('');
    setSuccessMessage('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function openHistory(product: ProductRow) {
    setHistoryProduct(product);
    setHistoryMovements([]);
    setHistoryLoading(true);
    const movements = await getProductSupplyHistory(product.$id);
    setHistoryMovements(movements);
    setHistoryLoading(false);
  }

  const filteredProducts = searchQuery.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const lowStockCount = products.filter((product) => product.quantity > 0 && product.quantity <= 5).length;

  function openEdit(product: ProductRow) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditEmoji(product.emoji);
    setEditSellingPrice(String(product.sellingUnitPrice));
    setFormError('');
  }

  async function handleSaveEdit() {
    if (!editingProduct || editSaving) return;
    const price = parseAmount(editSellingPrice);
    if (!editName.trim()) { setFormError('Le nom ne peut pas etre vide.'); return; }
    if (Number.isNaN(price) || price <= 0) { setFormError('Prix de vente invalide.'); return; }
    setEditSaving(true);
    setFormError('');
    try {
      const input: UpdateProductInput = {};
      if (editName.trim() !== editingProduct.name) input.name = editName.trim();
      if (editEmoji !== editingProduct.emoji) input.emoji = editEmoji;
      if (Math.round(price) !== editingProduct.sellingUnitPrice) input.sellingUnitPrice = Math.round(price);
      const updated = await updateProduct(editingProduct.$id, input);
      setProducts((prev) => prev.map((p) => (p.$id === updated.$id ? updated : p)));
      setEditingProduct(null);
      setSuccessMessage(`${updated.name} mis a jour.`);
    } catch (err) {
      setFormError(getControlErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteProduct || deleteSaving) return;
    setDeleteSaving(true);
    try {
      await deleteProduct(confirmDeleteProduct.$id);
      setProducts((prev) => prev.filter((p) => p.$id !== confirmDeleteProduct.$id));
      setConfirmDeleteProduct(null);
      setSuccessMessage(`${confirmDeleteProduct.name} supprime.`);
    } catch (err) {
      setConfirmDeleteProduct(null);
      setFormError(getControlErrorMessage(err));
    } finally {
      setDeleteSaving(false);
    }
  }

  const loadProducts = useCallback(async ({ silent: _silent = false }: { silent?: boolean } = {}) => {
    const [nextProducts, nextCategories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    setProducts(nextProducts);
    setCategories(nextCategories);
    setSelectedProductId((current) =>
      nextProducts.some((product: ProductRow) => product.$id === current) ? current : nextProducts[0]?.$id || ''
    );
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (supplyMode === 'new') {
      setUnit(defaultUnit);
    }
  }, [defaultUnit, supplyMode]);

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
      shopId: isExistingSupply ? selectedProduct!.shopId : 'pending-shop',
      name: isExistingSupply ? selectedProduct!.name : name.trim(),
      category: isExistingSupply ? selectedProduct!.category : (selectedCategory?.name ?? ''),
      emoji: isExistingSupply ? selectedProduct!.emoji : (newProductEmoji || selectedCategory?.emoji || '📦'),
      quantity: isExistingSupply ? selectedProduct!.quantity + parsedQuantity : parsedQuantity,
      unit: isExistingSupply ? selectedProduct!.unit : unit,
      purchaseUnitPrice: purchaseUnitPrice,
      sellingUnitPrice: Math.round(parsedSellingPrice),
    };
    const prevProducts = products;

    setProducts((prev) => {
      const exists = prev.some((p) => p.$id === tempProductId);
      const next = exists
        ? prev.map((p) => (p.$id === tempProductId ? tempProduct : p))
        : [...prev, tempProduct];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setSelectedProductId(tempProductId);
    setName('');
    setSelectedCategoryId('');
    setNewProductEmoji('');
    setQuantity('');
    setUnit(defaultUnit);
    setPurchaseUnitInput('');
    setSellingUnitPrice(isExistingSupply ? String(Math.round(parsedSellingPrice)) : '');

    setSaving(true);

    try {
      const product = await createProduct({
        productId: isExistingSupply ? selectedProduct?.$id : undefined,
        name: isExistingSupply ? selectedProduct?.name ?? '' : name,
        category: isExistingSupply ? selectedProduct?.category ?? '' : (selectedCategory?.name ?? ''),
        emoji: isExistingSupply ? selectedProduct?.emoji ?? '📦' : (newProductEmoji || selectedCategory?.emoji || '📦'),
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
      setSelectedProductId(prevProducts[0]?.$id || '');
      const message = getControlErrorMessage(error);
      logControlError('create-product', error);
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

  const ALL_EMOJIS = [
    '🍅','🥦','🧅','🧄','🌽','🥕',
    '🍆','🥬','🍋','🍌','🍊','🍇',
    '🍞','🥚','🧈','🌾','🫘','🥜',
    '🐟','🥩','🐔','🐑','🐷','🦐',
    '🥓','🧀','🥛','🧃','🫙','☕',
    '🍫','🧴','🧹','🧺','🧻','🪣',
    '💊','🏷️','📦','🛒',
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef as any}
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
                                {product.emoji} {product.name}
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

                  <View style={{ gap: 8 }}>
                    <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Emoji du produit</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {ALL_EMOJIS.map((emoji) => {
                        const effectiveEmoji = newProductEmoji || selectedCategory?.emoji || '📦';
                        const selected = effectiveEmoji === emoji;
                        return (
                          <Pressable
                            key={emoji}
                            onPress={() => setNewProductEmoji(emoji)}
                            style={({ pressed }: { pressed: boolean }) => ({
                              width: 44, height: 44, borderRadius: 14, borderCurve: 'continuous',
                              backgroundColor: selected ? '#111111' : '#F2F2F2',
                              alignItems: 'center', justifyContent: 'center',
                              opacity: pressed ? 0.7 : 1,
                            })}
                          >
                            <Text style={{ fontSize: 22 }}>{emoji}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

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
                            {ALL_EMOJIS.map((emoji) => (
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
                    label="Achat / unite"
                    value={purchaseUnitInput}
                    onChangeText={setPurchaseUnitInput}
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

              {parsedQuantity > 0 && purchaseUnitPrice > 0 ? (
                <View
                  style={{
                    borderRadius: 18,
                    borderCurve: 'continuous',
                    backgroundColor: '#F7F7F7',
                    borderWidth: 1,
                    borderColor: '#EEEEEE',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ color: '#777777', fontSize: 12, fontWeight: '600' }}>Cout total</Text>
                    <Text style={{ marginTop: 3, color: '#111111', fontSize: 17, fontWeight: '800' }}>
                      {formatMoney(parsedPurchaseTotal)}
                    </Text>
                  </View>
                  {parsedSellingPrice > 0 ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#777777', fontSize: 12, fontWeight: '600' }}>Benefice / unite</Text>
                      <Text style={{ marginTop: 3, color: '#2A8D55', fontSize: 17, fontWeight: '800' }}>
                        {formatMoney(parsedSellingPrice - purchaseUnitPrice)}
                      </Text>
                    </View>
                  ) : null}
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

            {/* ── Liste des produits ───────────────────────────────── */}
            {products.length > 0 ? (
              <View style={{ marginTop: 32, gap: 14 }}>
                <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>
                  Catalogue ({products.length})
                </Text>

                {/* Barre de recherche */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F2', borderRadius: 16, paddingHorizontal: 14, gap: 8 }}>
                  <Feather name="search" size={16} color="#AAAAAA" />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher un produit..."
                    placeholderTextColor="#AAAAAA"
                    style={{ flex: 1, height: 44, fontSize: 14, color: '#111111', fontWeight: '600' }}
                  />
                  {searchQuery.length > 0 ? (
                    <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                      <Feather name="x" size={15} color="#AAAAAA" />
                    </Pressable>
                  ) : null}
                </View>

                {filteredProducts.length === 0 ? (
                  <Text style={{ color: '#B4B4B4', fontSize: 13, fontWeight: '600', textAlign: 'center', paddingVertical: 12 }}>
                    Aucun produit correspondant
                  </Text>
                ) : (
                  filteredProducts.map((product) => {
                    const isLow = product.quantity > 0 && product.quantity <= 5;
                    const isEmpty = product.quantity === 0;
                    return (
                      <View
                        key={product.$id}
                        style={{
                          borderRadius: 18,
                          backgroundColor: '#F7F7F7',
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <Text style={{ fontSize: 28 }}>{product.emoji}</Text>
                        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                          <Text numberOfLines={1} style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>
                            {product.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: isEmpty ? '#D93D42' : isLow ? '#E07A10' : '#8E8E8E', fontSize: 12, fontWeight: '700' }}>
                              {isEmpty ? 'Rupture' : `${product.quantity} ${product.unit}`}
                            </Text>
                            <Text style={{ color: '#CCCCCC', fontSize: 12 }}>·</Text>
                            <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600' }}>
                              {formatMoney(product.sellingUnitPrice)} / {product.unit}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => openRestock(product)}
                          style={({ pressed }: { pressed: boolean }) => ({
                            width: 34, height: 34, borderRadius: 10, backgroundColor: '#E8F4FD',
                            alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          <Feather name="plus-circle" size={14} color="#2A8DEB" />
                        </Pressable>
                        <Pressable
                          onPress={() => openHistory(product)}
                          style={({ pressed }: { pressed: boolean }) => ({
                            width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBEBEB',
                            alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          <Feather name="clock" size={14} color="#555555" />
                        </Pressable>
                        <Pressable
                          onPress={() => openEdit(product)}
                          style={({ pressed }: { pressed: boolean }) => ({
                            width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBEBEB',
                            alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          <Feather name="edit-2" size={14} color="#555555" />
                        </Pressable>
                        <Pressable
                          onPress={() => setConfirmDeleteProduct(product)}
                          style={({ pressed }: { pressed: boolean }) => ({
                            width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFEEEE',
                            alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          <Feather name="trash-2" size={14} color="#D93D42" />
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal Edition ─────────────────────────────────────────── */}
      <Modal visible={editingProduct !== null} transparent animationType="fade" onRequestClose={() => setEditingProduct(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.24)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setEditingProduct(null)} />
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36, gap: 14 }}>
            <Text style={{ color: '#111111', fontSize: 20, fontWeight: '800' }}>Modifier le produit</Text>

            <View style={{ gap: 8 }}>
              <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Emoji</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ALL_EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => setEditEmoji(emoji)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      width: 44, height: 44, borderRadius: 14, borderCurve: 'continuous',
                      backgroundColor: editEmoji === emoji ? '#111111' : '#F2F2F2',
                      alignItems: 'center', justifyContent: 'center',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={editEmoji}
                onChangeText={setEditEmoji}
                maxLength={4}
                placeholder="Ou tape un emoji personnalisé"
                placeholderTextColor="#B4B4B4"
                style={{ height: 44, borderRadius: 14, backgroundColor: '#F7F7F7', paddingHorizontal: 14, fontSize: 22, color: '#111111' }}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Nom</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={{ height: 48, borderRadius: 14, backgroundColor: '#F7F7F7', paddingHorizontal: 14, fontSize: 15, color: '#111111', fontWeight: '600' }}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Prix de vente / unite (F)</Text>
              <TextInput
                value={editSellingPrice}
                onChangeText={setEditSellingPrice}
                keyboardType="number-pad"
                style={{ height: 48, borderRadius: 14, backgroundColor: '#F7F7F7', paddingHorizontal: 14, fontSize: 15, color: '#111111', fontWeight: '600' }}
              />
            </View>

            {formError ? <Text style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>{formError}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => { setEditingProduct(null); setFormError(''); }}
                style={{ flex: 1, height: 50, borderRadius: 16, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                style={({ pressed }: { pressed: boolean }) => ({ flex: 2, height: 50, borderRadius: 16, backgroundColor: '#2A8DEB', alignItems: 'center', justifyContent: 'center', opacity: pressed || editSaving ? 0.68 : 1 })}
              >
                {editSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Enregistrer</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Historique approvisionnements ───────────────────── */}
      <Modal visible={historyProduct !== null} transparent animationType="slide" onRequestClose={() => setHistoryProduct(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.24)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setHistoryProduct(null)} />
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, paddingBottom: 36, maxHeight: '75%' }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
                  {historyProduct?.emoji} {historyProduct?.name}
                </Text>
                <Text style={{ color: '#9A9A9A', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                  Historique des approvisionnements
                </Text>
              </View>
              <Pressable
                onPress={() => setHistoryProduct(null)}
                style={({ pressed }: { pressed: boolean }) => ({ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
              >
                <Feather name="x" size={16} color="#555555" />
              </Pressable>
            </View>

            {historyLoading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <ActivityIndicator color="#2A8DEB" />
              </View>
            ) : historyMovements.length === 0 ? (
              <View style={{ paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center', gap: 6 }}>
                <Feather name="package" size={32} color="#CCCCCC" />
                <Text style={{ color: '#B4B4B4', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                  Aucun approvisionnement enregistre
                </Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }} showsVerticalScrollIndicator={false}>
                {historyMovements.map((m) => {
                  const date = new Date(m.$createdAt);
                  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <View
                      key={m.$id}
                      style={{
                        backgroundColor: '#F7F7F7',
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="plus-circle" size={16} color="#2A8DEB" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: '#111111', fontSize: 14, fontWeight: '800' }}>
                          +{m.quantity} {m.unit}
                        </Text>
                        <Text style={{ color: '#9A9A9A', fontSize: 12, fontWeight: '600', marginTop: 1 }}>
                          {dateStr} · {timeStr}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ color: '#111111', fontSize: 13, fontWeight: '800' }}>
                          {formatMoney(m.totalCost)}
                        </Text>
                        <Text style={{ color: '#9A9A9A', fontSize: 11, fontWeight: '600' }}>
                          {formatMoney(m.unitCost)} / {m.unit}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal Confirmation suppression ────────────────────────── */}
      <Modal visible={confirmDeleteProduct !== null} transparent animationType="fade" onRequestClose={() => setConfirmDeleteProduct(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.24)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setConfirmDeleteProduct(null)} />
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36, gap: 16 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: '#111111', fontSize: 20, fontWeight: '800' }}>Supprimer ce produit ?</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 14, lineHeight: 20 }}>
                {confirmDeleteProduct?.emoji} <Text style={{ fontWeight: '700', color: '#111111' }}>{confirmDeleteProduct?.name}</Text> sera supprime definitivement. Cette action est irreversible.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setConfirmDeleteProduct(null)}
                style={{ flex: 1, height: 50, borderRadius: 16, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelete}
                style={({ pressed }: { pressed: boolean }) => ({ flex: 2, height: 50, borderRadius: 16, backgroundColor: '#D93D42', alignItems: 'center', justifyContent: 'center', opacity: pressed || deleteSaving ? 0.68 : 1 })}
              >
                {deleteSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Supprimer</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
