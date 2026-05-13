import { StyleSheet, View } from 'react-native';

import { ActionButton, ControlScreen, FormField, HeroMetric, ListRow, SectionTitle } from '@/components/control-ui';

const expenses = [
  { title: 'Glace', meta: 'Justificatif ajoute - 09:15', value: '8 000 FCFA' },
  { title: 'Transport fournisseur', meta: 'Sans justificatif - hier', value: '12 000 FCFA' },
  { title: 'Electricite', meta: 'Facture mensuelle', value: '22 000 FCFA' },
];

export default function ExpensesScreen() {
  return (
    <ControlScreen title="Depenses" subtitle="Saisie courte pour garder les justificatifs et la marge claire.">
      <HeroMetric label="Depenses du jour" value="42 000 FCFA" detail="3 lignes" accent="warning" />

      <SectionTitle>Nouvelle depense</SectionTitle>
      <View style={styles.formGrid}>
        <FormField label="Categorie" value="Glace" />
        <FormField label="Montant" value="8 000 FCFA" />
      </View>
      <View style={styles.formGrid}>
        <FormField label="Justificatif" value="Photo ajoutee" />
        <FormField label="Paiement" value="Cash" />
      </View>
      <View style={styles.actions}>
        <ActionButton label="Photo justificatif" />
        <ActionButton label="Enregistrer" />
      </View>

      <SectionTitle action="Cette semaine">Recentes</SectionTitle>
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
  formGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
