import { StyleSheet, View } from 'react-native';

import { ActionButton, ControlScreen, ListRow, MetricCard, SectionTitle } from '@/components/control-ui';

const expenses = [
  { title: 'Glace', meta: 'Justificatif ajoute - 09:15', value: '8 000 FCFA' },
  { title: 'Transport fournisseur', meta: 'Sans justificatif - hier', value: '12 000 FCFA' },
  { title: 'Electricite', meta: 'Facture mensuelle', value: '22 000 FCFA' },
];

export default function ExpensesScreen() {
  return (
    <ControlScreen title="Depenses" subtitle="Saisie simple avec categorie et justificatif">
      <MetricCard label="Depenses du jour" value="42 000 FCFA" accent="warning" />
      <View style={styles.actions}>
        <ActionButton label="Nouvelle depense" />
        <ActionButton label="Photo justificatif" />
      </View>

      <SectionTitle>Recentes</SectionTitle>
      {expenses.map((expense) => (
        <ListRow
          key={expense.title}
          title={expense.title}
          meta={expense.meta}
          value={expense.value}
          tone="warning"
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
