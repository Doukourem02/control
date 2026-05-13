import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ControlRole, useControlRole } from '@/context/control-role';

type ScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function ControlScreen({ title, subtitle, children }: ScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <RoleSwitcher />
        <View style={styles.header}>
          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText themeColor="textSecondary">{subtitle}</ThemedText>
        </View>
        {children}
      </ScrollView>
    </ThemedView>
  );
}

export function MetricCard({
  label,
  value,
  accent = 'primary',
}: {
  label: string;
  value: string;
  accent?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  return (
    <ThemedView style={[styles.card, styles.metricCard, accentStyles[accent]]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText selectable style={styles.metricValue}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

export function ActionButton({ label }: { label: string }) {
  return (
    <Pressable style={({ pressed }: { pressed: boolean }) => [styles.actionButton, pressed && styles.pressed]}>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

export function ListRow({
  title,
  meta,
  value,
  tone,
}: {
  title: string;
  meta: string;
  value?: string;
  tone?: 'success' | 'warning' | 'danger';
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {meta}
        </ThemedText>
      </View>
      {value ? <ThemedText style={[styles.rowValue, tone && toneStyles[tone]]}>{value}</ThemedText> : null}
    </ThemedView>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <ThemedText type="smallBold" style={styles.sectionTitle}>{children}</ThemedText>;
}

export function MiniChart({ values }: { values: string[] }) {
  const heights = [56, 78, 64, 92, 74, 112, 88];

  return (
    <ThemedView style={styles.card}>
      <View style={styles.chartHeader}>
        <ThemedText type="smallBold">Evolution semaine</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          CA
        </ThemedText>
      </View>
      <View style={styles.chart}>
        {values.map((value, index) => (
          <View key={value} style={styles.barItem}>
            <View style={[styles.bar, { height: heights[index] }]} />
            <ThemedText type="small" themeColor="textSecondary">
              {value}
            </ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

function RoleSwitcher() {
  const { role, setRole } = useControlRole();

  return (
    <ThemedView type="backgroundElement" style={styles.roleSwitch}>
      <RoleButton label="Employe" value="employee" role={role} onPress={setRole} />
      <RoleButton label="Proprietaire" value="owner" role={role} onPress={setRole} />
    </ThemedView>
  );
}

function RoleButton({
  label,
  value,
  role,
  onPress,
}: {
  label: string;
  value: ControlRole;
  role: ControlRole;
  onPress: (role: ControlRole) => void;
}) {
  const selected = role === value;

  return (
    <Pressable
      onPress={() => onPress(value)}
      style={({ pressed }: { pressed: boolean }) => [
        styles.roleButton,
        selected && styles.roleButtonSelected,
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={selected && styles.roleButtonTextSelected}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const accentStyles = StyleSheet.create({
  primary: { borderLeftColor: '#6D5DF6' },
  success: { borderLeftColor: '#11B66D' },
  warning: { borderLeftColor: '#FF9500' },
  danger: { borderLeftColor: '#F04438' },
});

const toneStyles = StyleSheet.create({
  success: { color: '#0B8F55' },
  warning: { color: '#B76A00' },
  danger: { color: '#C2332B' },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 120,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 24,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#ECEEF3',
  },
  metricCard: {
    borderLeftWidth: 5,
  },
  metricValue: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: 800,
    fontVariant: ['tabular-nums'],
  },
  actionButton: {
    flexGrow: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEEF3',
  },
  pressed: {
    opacity: 0.72,
  },
  row: {
    borderRadius: 18,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: 800,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    paddingTop: Spacing.one,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chart: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  bar: {
    width: '80%',
    borderRadius: 999,
    backgroundColor: '#7C5CFF',
  },
  roleSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    gap: 4,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  roleButtonSelected: {
    backgroundColor: '#101828',
  },
  roleButtonTextSelected: {
    color: '#FFFFFF',
  },
});
