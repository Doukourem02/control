import { ControlScreen, ListRow, MetricCard, SectionTitle } from '@/components/control-ui';
import { stores } from '@/data/control-demo';

export default function StoresScreen() {
  return (
    <ControlScreen title="Boutiques" subtitle="Comparaison rapide des points de vente">
      <MetricCard label="Boutiques actives" value="3" accent="primary" />
      <SectionTitle>Performance aujourd'hui</SectionTitle>
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
