import { StyleSheet, View } from 'react-native';

import {
  ActionButton,
  CheckoutPanel,
  ControlScreen,
  FormField,
  ListRow,
  ProductTile,
  SectionTitle,
  StatusPill,
} from '@/components/control-ui';
import { products, saleBasket } from '@/data/control-demo';

export default function SaleScreen() {
  return (
    <ControlScreen title="Vente" subtitle="Selection produit, panier et encaissement sur le meme ecran.">
      <CheckoutPanel>
        <View style={styles.checkoutHeader}>
          <View>
            <StatusPill tone="primary">Panier #1042</StatusPill>
            <View style={styles.checkoutTitle}>
              <FormField label="Client" value="Comptoir" />
              <FormField label="Mode" value="Cash" />
            </View>
          </View>
          <View style={styles.totalBlock}>
            <StatusPill tone="success">Pret</StatusPill>
          </View>
        </View>

        <View style={styles.totalRow}>
          <ListRow title="Total panier" meta="2 articles - remise 0 FCFA" value="32 000 FCFA" tone="success" />
        </View>
      </CheckoutPanel>

      <SectionTitle action="Categories">Produits rapides</SectionTitle>
      <View style={styles.productList}>
        {products.map((product) => (
          <ProductTile
            key={product.name}
            name={product.name}
            meta={`${product.category} - ${product.stock} disponible`}
            price={product.price}
            status={product.status}
          />
        ))}
      </View>

      <SectionTitle>Panier</SectionTitle>
      {saleBasket.map((item) => (
        <ListRow key={item.label} title={item.label} meta={item.quantity} value={item.amount} tone="success" />
      ))}

      <View style={styles.actions}>
        <ActionButton label="Cash" />
        <ActionButton label="Mobile money" />
      </View>
      <ActionButton label="Encaisser 32 000 FCFA" />
    </ControlScreen>
  );
}

const styles = StyleSheet.create({
  checkoutHeader: {
    gap: 12,
  },
  checkoutTitle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  totalBlock: {
    alignSelf: 'flex-end',
  },
  totalRow: {
    gap: 8,
  },
  productList: {
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
