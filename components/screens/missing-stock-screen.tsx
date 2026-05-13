import { Card, ChoicePill, InfoRow, PrimaryButton, SectionTitle } from '@/components/seller-ui';
import { ScreenShell } from '@/components/screen-shell';
import { useStockStore } from '@/components/stock-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

const reasons = ['Perdu', 'Abîmé', 'Erreur', 'Autre'];

function toNumber(value: string) {
  return Number(value.replace(/\s/g, '').replace(',', '.')) || 0;
}

export function MissingStockScreen() {
  const { products, missingStocks, addMissingStock } = useStockStore();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [reason, setReason] = useState(reasons[0]);
  const [note, setNote] = useState('');

  const restockProducts = products.filter((product) => product.quantityKg <= 0);
  const availableProducts = products.filter((product) => product.quantityKg > 0);
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const quantity = toNumber(quantityKg);
  const canSave =
    Boolean(selectedProduct) &&
    quantity > 0 &&
    quantity <= (selectedProduct?.quantityKg || 0) &&
    note.trim().length > 0;

  function handleSaveMissingStock() {
    if (!selectedProduct || !canSave) {
      return;
    }

    const saved = addMissingStock({
      productId: selectedProduct.id,
      quantityKg: quantity,
      reason,
      note: note.trim(),
    });

    if (saved) {
      setQuantityKg('');
      setNote('');
    }
  }

  return (
    <ScreenShell title="Manquant" subtitle="Voir ce qui doit être vérifié ou réapprovisionné">
      <View style={{ gap: 10 }}>
        <SectionTitle>À réapprovisionner</SectionTitle>
        {restockProducts.length === 0 ? (
          <Card accent="#FFF0F0">
            <Text style={{ color: '#7A2424', fontSize: 16, fontWeight: '800', lineHeight: 22 }}>
              Aucun produit fini pour l’instant. Quand un produit arrive à 0 kg après les ventes, il
              apparaîtra ici.
            </Text>
          </Card>
        ) : (
          restockProducts.map((product) => (
            <InfoRow
              key={product.id}
              label={`${product.name} - ${product.category}`}
              value="0 kg disponible"
              icon="package-variant-closed-remove"
              accent="#DC2626"
            />
          ))
        )}
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Signaler un écart</SectionTitle>
        {availableProducts.length === 0 ? (
          <Card>
            <Text style={{ color: '#777777', fontSize: 16, fontWeight: '800', lineHeight: 22 }}>
              Aucun produit en stock pour signaler un manquant.
            </Text>
          </Card>
        ) : (
          availableProducts.map((product) => {
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
                    backgroundColor: active ? '#111111' : '#FFF0F0',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons
                    name="package-variant-closed-remove"
                    size={27}
                    color={active ? '#FFFFFF' : '#DC2626'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#171717', fontSize: 18, fontWeight: '900' }}>
                    {product.name}
                  </Text>
                  <Text style={{ color: '#777777', fontSize: 13, fontWeight: '800' }}>
                    {product.quantityKg.toLocaleString('fr-FR')} kg disponible
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <Card>
        <SectionTitle>Quantité manquante</SectionTitle>
        <TextInput
          value={quantityKg}
          onChangeText={setQuantityKg}
          placeholder="Ex: 2 kg"
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
        <SectionTitle>Raison</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {reasons.map((item) => (
            <ChoicePill
              key={item}
              label={item}
              active={reason === item}
              onPress={() => setReason(item)}
            />
          ))}
        </View>
      </View>

      <Card>
        <SectionTitle>Note</SectionTitle>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Ex: produit abîmé, erreur de pesée..."
          placeholderTextColor="#8F8A85"
          style={{ color: '#171717', fontSize: 17, fontWeight: '700' }}
        />
      </Card>

      <PrimaryButton
        title="Signaler le manquant"
        icon="package-variant-closed-remove"
        disabled={!canSave}
        onPress={handleSaveMissingStock}
      />

      <View style={{ gap: 10 }}>
        <SectionTitle>Historique</SectionTitle>
        {missingStocks.length === 0 ? (
          <Card>
            <Text style={{ color: '#777777', fontSize: 16, fontWeight: '800', lineHeight: 22 }}>
              Aucun manquant signalé.
            </Text>
          </Card>
        ) : (
          missingStocks.map((item) => (
            <InfoRow
              key={item.id}
              label={`${item.productName} - ${item.reason}`}
              value={`${item.quantityKg.toLocaleString('fr-FR')} kg`}
              icon="package-variant-closed-remove"
              accent="#DC2626"
            />
          ))
        )}
      </View>
    </ScreenShell>
  );
}
