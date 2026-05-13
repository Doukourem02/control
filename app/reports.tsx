import { ControlScreen, HeroMetric, ListRow, MiniChart, SectionTitle } from '@/components/control-ui';
import { weeklyRevenue } from '@/data/control-demo';

const reportRows = [
  { title: 'Produit le plus rentable', meta: 'Crevettes - marge moyenne 38%', value: '38%' },
  { title: 'Meilleure boutique', meta: 'Poissonnerie Cocody', value: '248 500 FCFA' },
  { title: 'Taux de perte', meta: 'Semaine actuelle', value: '4.8%' },
];

export default function ReportsScreen() {
  return (
    <ControlScreen title="Rapports" subtitle="Rentabilite, marges et tendances.">
      <HeroMetric label="Benefice net semaine" value="612 000 FCFA" detail="Marge +4%" accent="success" />
      <MiniChart values={weeklyRevenue} />
      <SectionTitle>Indicateurs</SectionTitle>
      {reportRows.map((row) => (
        <ListRow key={row.title} title={row.title} meta={row.meta} value={row.value} />
      ))}
    </ControlScreen>
  );
}
