import { ControlScreen, HeroMetric, ListRow, MetricCard, SectionTitle } from '@/components/control-ui';
import { stores } from '@/data/control-demo';

export default function StoresScreen() {
  return (
    <ControlScreen title="Boutiques" subtitle="Comparaison rapide des points de vente.">
      <HeroMetric label="Boutiques actives" value="3" detail="Toutes ouvertes" accent="primary" />
      <MetricCard label="CA consolide" value="528 500 FCFA" accent="success" />
      <SectionTitle>{"Performance aujourd'hui"}</SectionTitle>
      {stores.map((store) => (
        <ListRow
          key={store.name}
          title={store.name}
          meta={`${store.status} - benefice ${store.profit}`}
          value={store.revenue}
        />
      ))}
    </ControlScreen>
  );
}
