import { ControlScreen, ListRow, MetricCard, SectionTitle } from '@/components/control-ui';

const settings = [
  { title: 'Employes', meta: 'Roles : proprietaire, manager, vendeuse, comptable' },
  { title: 'Organisation', meta: 'Entreprise, boutiques et activites commerciales' },
  { title: 'Abonnement', meta: 'Free, Pro, Business' },
  { title: 'Exports', meta: 'PDF et Excel plus tard' },
];

export default function MoreScreen() {
  return (
    <ControlScreen title="Plus" subtitle="Parametres et vision long terme">
      <MetricCard label="Plan actuel" value="Prototype" accent="primary" />
      <SectionTitle>Configuration</SectionTitle>
      {settings.map((setting) => (
        <ListRow key={setting.title} title={setting.title} meta={setting.meta} />
      ))}
    </ControlScreen>
  );
}
