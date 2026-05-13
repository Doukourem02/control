import { ControlScreen, ListRow, MetricCard, SectionTitle } from '@/components/control-ui';
import { alerts } from '@/data/control-demo';

export default function AlertsScreen() {
  return (
    <ControlScreen title="Alertes" subtitle="Problemes qui demandent une decision">
      <MetricCard label="Alertes ouvertes" value={`${alerts.length}`} accent="danger" />
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
