import { View, StyleSheet } from 'react-native';

import { ActionButton, ControlScreen, HeroMetric, ListRow, MetricCard, ProductTile, SectionTitle } from '@/components/control-ui';
import { products } from '@/data/control-demo';

export default function StockScreen() {
  return (
    <ControlScreen title="Stock" subtitle="Etat des produits, alertes faibles et mouvements rapides.">
      <HeroMetric label="Valeur stock estimee" value="418 000 FCFA" detail="37 kg" accent="success" />

      <View style={styles.grid}>
        <MetricCard label="Produits critiques" value="1" accent="danger" />
        <MetricCard label="Marge moyenne" value="30.5%" accent="primary" />
      </View>

      <View style={styles.actions}>
        <ActionButton label="Entree stock" />
        <ActionButton label="Sortie stock" />
      </View>

      <SectionTitle action="Inventaire">Produits</SectionTitle>
      <View style={styles.productList}>
        {products.map((product) => (
          <ProductTile
            key={product.name}
            name={product.name}
            meta={`${product.stock} - marge ${product.margin}`}
            price={product.price}
            status={product.status}
          />
        ))}
      </View>

      <SectionTitle>Derniers mouvements</SectionTitle>
      <ListRow title="Reception thon rouge" meta="Fournisseur Port Bouet - 07:40" value="+12 kg" tone="success" />
      <ListRow title="Perte glace" meta="Sortie exceptionnelle - hier" value="-3 sacs" tone="warning" />
    </ControlScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  productList: {
    gap: 10,
  },
});
