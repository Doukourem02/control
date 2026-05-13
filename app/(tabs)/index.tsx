import type { Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionButton, ControlScreen, HeroMetric, ListRow, MetricCard, MiniChart, SectionTitle } from '@/components/control-ui';
import { alerts, quickActions, stores, todaySummary, transactions, weeklyRevenue } from '@/data/control-demo';
import { useControlRole } from '@/context/control-role';

export default function HomeScreen() {
  const { role } = useControlRole();

  if (role === 'owner') {
    return <OwnerDashboard />;
  }

  return <EmployeeHome />;
}

function EmployeeHome() {
  return (
    <ControlScreen
      title="Accueil boutique"
      subtitle="Vue employee pour vendre, suivre le stock et fermer la caisse.">
      <HeroMetric label="Ventes du jour" value={todaySummary.revenue} detail="31 tickets" accent="primary" />
      <View style={styles.grid}>
        <MetricCard label="Nombre de ventes" value={`${todaySummary.salesCount}`} />
        <MetricCard label="Caisse attendue" value={todaySummary.cashExpected} accent="success" />
      </View>

      <SectionTitle>Actions rapides</SectionTitle>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <ActionButton key={action.label} label={action.label} href={action.href as Href} />
        ))}
      </View>

      <SectionTitle action="Aujourd'hui">Derniers mouvements</SectionTitle>
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

function OwnerDashboard() {
  return (
    <ControlScreen
      title="Dashboard"
      subtitle="Vue proprietaire pour comparer les boutiques et decider vite.">
      <HeroMetric label="Chiffre d'affaires aujourd'hui" value="528 500 FCFA" detail="3 boutiques" accent="primary" />
      <View style={styles.grid}>
        <MetricCard label="Benefice estime" value="150 500 FCFA" accent="success" />
        <MetricCard label="Depenses" value={todaySummary.expenses} accent="warning" />
      </View>
      <MiniChart values={weeklyRevenue} />

      <SectionTitle>Boutiques</SectionTitle>
      {stores.map((store) => (
        <ListRow key={store.name} title={store.name} meta={store.status} value={store.revenue} />
      ))}

      <SectionTitle>Alertes recentes</SectionTitle>
      {alerts.slice(0, 2).map((alert) => (
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

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
