import { View, StyleSheet } from 'react-native';

import { ActionButton, ControlScreen, ListRow, SectionTitle } from '@/components/control-ui';
import { products } from '@/data/control-demo';

export default function StockScreen() {
  return (
    <ControlScreen title="Stock" subtitle="Quantites, marges et sorties exceptionnelles">
      <View style={styles.actions}>
        <ActionButton label="Entree stock" />
        <ActionButton label="Sortie stock" />
      </View>

      <SectionTitle>Produits</SectionTitle>
      {products.map((product) => (
        <ListRow
          key={product.name}
          title={product.name}
          meta={`${product.stock} - marge ${product.margin}`}
          value={product.status}
          tone={product.status === 'Critique' ? 'danger' : product.status === 'Faible' ? 'warning' : 'success'}
        />
      ))}
    </ControlScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
