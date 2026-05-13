import { Card, ChoicePill, PrimaryButton, SectionTitle } from '@/components/seller-ui';
import { ScreenShell } from '@/components/screen-shell';
import { useStockStore } from '@/components/stock-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

function toNumber(value: string) {
  return Number(value.replace(/\s/g, '').replace(',', '.')) || 0;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

export function SellScreen() {
  const { products, addSale } = useStockStore();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [payment, setPayment] = useState('Cash');

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const quantity = toNumber(quantityKg);
  const total = selectedProduct ? quantity * selectedProduct.salePricePerKg : 0;
  const canSell = Boolean(selectedProduct) && quantity > 0 && quantity <= (selectedProduct?.quantityKg || 0);

  function handleSale() {
    if (!selectedProduct || !canSell) {
      return;
    }

    const saved = addSale({
      productId: selectedProduct.id,
      quantityKg: quantity,
    });

    if (saved) {
      setQuantityKg('');
    }
  }

  return (
    <ScreenShell title="Vendre" subtitle="Le vendeur choisit uniquement un produit déjà en stock">
      <Card accent="#111111">
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Total à encaisser</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 40, fontWeight: '900' }}>
          {formatMoney(total)}
        </Text>
        {selectedProduct ? (
          <Text style={{ color: '#D8D8D8', fontSize: 14, fontWeight: '800' }}>
            {selectedProduct.name} - {quantity || 0} kg
          </Text>
        ) : null}
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Produit vendu</SectionTitle>
        {products.length === 0 ? (
          <Card>
            <Text style={{ color: '#777777', fontSize: 16, fontWeight: '800', lineHeight: 22 }}>
              Aucun produit disponible. Il faut d’abord renseigner le stock avant de vendre.
            </Text>
          </Card>
        ) : (
          products.map((product) => {
            const active = selectedProductId === product.id;

            return (
              <Pressable
                key={product.id}
                onPress={() => setSelectedProductId(product.id)}
                style={({ pressed }: { pressed: boolean }) => ({
                  borderRadius: 22,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? '#111111' : '#F0EEE9',
                  padding: 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: active ? '#111111' : '#EAF3FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name="package-variant-closed"
                    size={27}
                    color={active ? '#FFFFFF' : '#2563EB'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#171717', fontSize: 18, fontWeight: '900' }}>
                    {product.name}
                  </Text>
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '800' }}>
                    {product.quantityKg.toLocaleString('fr-FR')} kg disponible -{' '}
                    {formatMoney(product.salePricePerKg)}/kg
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <Card>
        <SectionTitle>Quantité vendue</SectionTitle>
        <TextInput
          value={quantityKg}
          onChangeText={setQuantityKg}
          placeholder="Ex: 5 kg"
          placeholderTextColor="#8F8A85"
          keyboardType="numeric"
          style={{ color: '#171717', fontSize: 22, fontWeight: '900' }}
        />
        {selectedProduct && quantity > selectedProduct.quantityKg ? (
          <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '800' }}>
            Quantité supérieure au stock disponible.
          </Text>
        ) : null}
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Paiement</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Cash', 'Mobile Money', 'Crédit'].map((item) => (
            <ChoicePill
              key={item}
              label={item}
              active={payment === item}
              onPress={() => setPayment(item)}
            />
          ))}
        </View>
      </View>

      <PrimaryButton
        title="Valider la vente"
        icon="cash-check"
        disabled={!canSell}
        onPress={handleSale}
      />
    </ScreenShell>
  );
}
