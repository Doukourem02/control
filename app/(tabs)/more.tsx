import type { Href } from 'expo-router';

import { ActionButton, ControlScreen, HeroMetric, ListRow, SectionTitle } from '@/components/control-ui';
import { useControlRole } from '@/context/control-role';

type MoreShortcut = {
  label: string;
  href: Href;
};

const settings = [
  { title: 'Employes', meta: 'Roles : proprietaire, manager, vendeuse, comptable' },
  { title: 'Organisation', meta: 'Entreprise, boutiques et activites commerciales' },
  { title: 'Abonnement', meta: 'Free, Pro, Business' },
  { title: 'Exports', meta: 'PDF et Excel plus tard' },
];

const employeeShortcuts: MoreShortcut[] = [
  { label: 'Ajouter depense', href: '/expenses' },
  { label: 'Cloturer caisse', href: '/cash' },
];

const ownerShortcuts: MoreShortcut[] = [
  { label: 'Boutiques', href: '/stores' },
  { label: 'Alertes', href: '/alerts' },
  { label: 'Rapports', href: '/reports' },
];

export default function MoreScreen() {
  const { role } = useControlRole();
  const shortcuts = role === 'owner' ? ownerShortcuts : employeeShortcuts;

  return (
    <ControlScreen title="Plus" subtitle="Parametres, equipe et exports.">
      <HeroMetric label="Plan actuel" value="Prototype" detail="Interne" accent="primary" />

      <SectionTitle>Raccourcis</SectionTitle>
      {shortcuts.map((shortcut) => (
        <ActionButton key={shortcut.label} label={shortcut.label} href={shortcut.href} />
      ))}

      <ActionButton label="Inviter un employe" />
      <SectionTitle>Configuration</SectionTitle>
      {settings.map((setting) => (
        <ListRow key={setting.title} title={setting.title} meta={setting.meta} />
      ))}
    </ControlScreen>
  );
}
