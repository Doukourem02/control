import { ControlScreen, HeroMetric, ListRow, SectionTitle } from '@/components/control-ui';
import { alerts } from '@/data/control-demo';

export default function AlertsScreen() {
  return (
    <ControlScreen title="Alertes" subtitle="Problemes qui demandent une decision.">
      <HeroMetric label="Alertes ouvertes" value={`${alerts.length}`} detail="Priorite caisse" accent="danger" />
      <SectionTitle>A traiter</SectionTitle>
      {alerts.map((alert) => (
        <ListRow
          key={alert.title}
          title={alert.title}
          meta={alert.detail}
          tone={alert.level === 'danger' ? 'danger' : 'warning'}
        />
      ))}
    </ControlScreen>
  );
}
