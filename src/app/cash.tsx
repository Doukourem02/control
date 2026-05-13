import { ControlScreen, ListRow, MetricCard, SectionTitle } from '@/components/control-ui';
import { todaySummary, transactions } from '@/data/control-demo';

export default function CashScreen() {
  return (
    <ControlScreen title="Caisse" subtitle="Cloture journee et controle des ecarts">
      <MetricCard label="Caisse theorique" value={todaySummary.cashExpected} accent="primary" />
      <MetricCard label="Caisse declaree" value={todaySummary.cashDeclared} accent="success" />
      <MetricCard label="Ecart a verifier" value="-2 500 FCFA" accent="danger" />

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
