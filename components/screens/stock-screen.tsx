import { Card, InfoRow, PrimaryButton, SectionTitle } from '@/components/seller-ui';
import { ScreenShell } from '@/components/screen-shell';
import { useStockStore } from '@/components/stock-store';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

function toNumber(value: string) {
  return Number(value.replace(/\s/g, '').replace(',', '.')) || 0;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

export function StockScreen() {
  const { products, totalStockKg, stockPurchaseValue, addStock } = useStockStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [salePricePerKg, setSalePricePerKg] = useState('');

  const canAdd =
    name.trim().length > 0 &&
    toNumber(quantityKg) > 0 &&
    toNumber(purchaseAmount) > 0 &&
    toNumber(salePricePerKg) > 0;

  function handleAddStock() {
    if (!canAdd) {
      return;
    }

    addStock({
      name: name.trim(),
      category: category.trim() || 'Autre',
      quantityKg: toNumber(quantityKg),
      purchaseAmount: toNumber(purchaseAmount),
      salePricePerKg: toNumber(salePricePerKg),
    });

    setName('');
    setCategory('');
    setQuantityKg('');
    setPurchaseAmount('');
    setSalePricePerKg('');
  }

  return (
    <ScreenShell title="Stock" subtitle="C’est ici que le propriétaire renseigne ce qui entre">
      <Card accent="#EFFAF6">
        <Text style={{ color: '#367A60', fontSize: 15, fontWeight: '800' }}>Stock actuel</Text>
        <Text style={{ color: '#0B352F', fontSize: 36, fontWeight: '900' }}>
          {totalStockKg.toLocaleString('fr-FR')} kg
        </Text>
        <Text style={{ color: '#367A60', fontSize: 14, fontWeight: '800' }}>
          Achat total: {formatMoney(stockPurchaseValue)}
        </Text>
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Ajouter un stock</SectionTitle>
        <Card>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Produit: poisson, poulet, viande..."
            placeholderTextColor="#8F8A85"
            style={{ color: '#171717', fontSize: 18, fontWeight: '800' }}
          />
          <View style={{ height: 1, backgroundColor: '#DDDDDD' }} />
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="Catégorie: Poisson, Poulet, Viande"
            placeholderTextColor="#8F8A85"
            style={{ color: '#171717', fontSize: 18, fontWeight: '800' }}
          />
          <View style={{ height: 1, backgroundColor: '#DDDDDD' }} />
          <TextInput
            value={quantityKg}
            onChangeText={setQuantityKg}
            placeholder="Quantité achetée en kg"
            placeholderTextColor="#8F8A85"
            keyboardType="numeric"
            style={{ color: '#171717', fontSize: 18, fontWeight: '800' }}
          />
          <View style={{ height: 1, backgroundColor: '#DDDDDD' }} />
          <TextInput
            value={purchaseAmount}
            onChangeText={setPurchaseAmount}
            placeholder="Montant achat total"
            placeholderTextColor="#8F8A85"
            keyboardType="numeric"
            style={{ color: '#171717', fontSize: 18, fontWeight: '800' }}
          />
          <View style={{ height: 1, backgroundColor: '#DDDDDD' }} />
          <TextInput
            value={salePricePerKg}
            onChangeText={setSalePricePerKg}
            placeholder="Prix de vente par kg"
            placeholderTextColor="#8F8A85"
            keyboardType="numeric"
            style={{ color: '#171717', fontSize: 18, fontWeight: '800' }}
          />
        </Card>
        <PrimaryButton
          title="Ajouter au stock"
          icon="package-variant-closed-plus"
          disabled={!canAdd}
          onPress={handleAddStock}
        />
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Produits en stock</SectionTitle>
        {products.length === 0 ? (
          <Card>
            <Text style={{ color: '#777777', fontSize: 16, fontWeight: '800', lineHeight: 22 }}>
              Aucun produit pour l’instant. Ajoute d’abord ce que tu as acheté: nom, kilos,
              montant d’achat et prix de vente.
            </Text>
          </Card>
        ) : (
          products.map((item) => (
            <InfoRow
              key={item.id}
              label={`${item.name} - ${item.category}`}
              value={`${item.quantityKg.toLocaleString('fr-FR')} kg à ${formatMoney(
                item.salePricePerKg,
              )}/kg`}
              icon="package-variant-closed"
              accent="#2563EB"
            />
          ))
        )}
      </View>
    </ScreenShell>
  );
}
