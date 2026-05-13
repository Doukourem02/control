import { StyleSheet, View } from 'react-native';

import { ActionButton, ControlScreen, ListRow, MetricCard, SectionTitle } from '@/components/control-ui';
import { products } from '@/data/control-demo';

export default function SaleScreen() {
  return (
    <ControlScreen title="Nouvelle vente" subtitle="Recherche produit, panier et encaissement">
      <MetricCard label="Panier en cours" value="0 FCFA" accent="primary" />

      <SectionTitle>Produits rapides</SectionTitle>
      {products.map((product) => (
        <ListRow
          key={product.name}
          title={product.name}
          meta={`${product.stock} disponible - ${product.margin} marge`}
          value={product.price}
          tone={product.status === 'Critique' ? 'danger' : product.status === 'Faible' ? 'warning' : 'success'}
        />
      ))}

      <View style={styles.actions}>
        <ActionButton label="Cash" />
        <ActionButton label="Mobile money" />
      </View>
      <ActionButton label="Encaisser" />
    </ControlScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
