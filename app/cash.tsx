import { StyleSheet, View } from 'react-native';

import { ActionButton, ControlScreen, FormField, HeroMetric, ListRow, MetricCard, SectionTitle } from '@/components/control-ui';
import { cashChecks, todaySummary, transactions } from '@/data/control-demo';

export default function CashScreen() {
  return (
    <ControlScreen title="Caisse" subtitle="Controle de cloture avec ecart visible avant validation.">
      <HeroMetric label="Caisse theorique" value={todaySummary.cashExpected} detail="A verifier" accent="primary" />

      <View style={styles.grid}>
        <MetricCard label="Declaree" value={todaySummary.cashDeclared} accent="success" />
        <MetricCard label="Ecart" value="-2 500 FCFA" accent="danger" />
      </View>

      <SectionTitle>Checklist cloture</SectionTitle>
      <View style={styles.formGrid}>
        {cashChecks.map((check) => (
          <FormField key={check.label} label={check.label} value={`${check.value} - ${check.status}`} />
        ))}
      </View>

      <View style={styles.actions}>
        <ActionButton label="Compter caisse" />
        <ActionButton label="Cloturer journee" />
      </View>

      <SectionTitle>Mouvements caisse</SectionTitle>
      {transactions.map((transaction) => (
        <ListRow
          key={transaction.label}
          title={transaction.label}
          meta={transaction.meta}
          value={transaction.amount}
          tone={transaction.amount.startsWith('+') ? 'success' : 'warning'}
        />
      ))}
    </ControlScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  formGrid: {
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
