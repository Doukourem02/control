import { Link, type Href } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ControlRole, useControlRole } from '@/context/control-role';

type ScreenProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: ReactNode;
};

export function ControlScreen({ title, subtitle, eyebrow = 'Poissonnerie Cocody', children }: ScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.avatar}>
              <ThemedText type="smallBold" style={styles.avatarText}>
                C
              </ThemedText>
            </View>
            <RoleSwitcher />
          </View>

          <View style={styles.header}>
            <View style={styles.eyebrowRow}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {eyebrow}
              </ThemedText>
              <StatusPill tone="success">Sync</StatusPill>
            </View>
            <ThemedText selectable type="title" style={styles.screenTitle}>
              {title}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          </View>

          {children}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

export function HeroMetric({
  label,
  value,
  detail,
  accent = 'primary',
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: Accent;
}) {
  return (
    <ThemedView style={[styles.heroMetric, accentBorderStyles[accent]]}>
      <View style={styles.metricCopy}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText selectable style={styles.heroValue}>
          {value}
        </ThemedText>
      </View>
      {detail ? <StatusPill tone={accentToTone[accent]}>{detail}</StatusPill> : null}
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
  accent?: Accent;
}) {
  return (
    <ThemedView style={[styles.card, styles.metricCard, accentBorderStyles[accent]]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText selectable style={styles.metricValue}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

export function ActionButton({ label, href }: { label: string; href?: Href }) {
  const button = (
    <Pressable style={({ pressed }: { pressed: boolean }) => [styles.actionButton, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={styles.actionText}>
        {label}
      </ThemedText>
    </Pressable>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        {button}
      </Link>
    );
  }

  return button;
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
  tone?: Tone;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={styles.rowText}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {meta}
        </ThemedText>
      </View>
      {value ? <ThemedText style={[styles.rowValue, tone && toneStyles[tone]]}>{value}</ThemedText> : null}
    </ThemedView>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="smallBold" style={styles.sectionTitle}>
        {children}
      </ThemedText>
      {action ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {action}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function MiniChart({ values }: { values: string[] }) {
  const heights = [52, 74, 61, 90, 69, 112, 84];

  return (
    <ThemedView style={styles.card}>
      <View style={styles.chartHeader}>
        <View>
          <ThemedText type="smallBold">Evolution semaine</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {"Chiffre d'affaires par jour"}
          </ThemedText>
        </View>
        <StatusPill tone="primary">+18%</StatusPill>
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

export function ProductTile({
  name,
  meta,
  price,
  status,
}: {
  name: string;
  meta: string;
  price: string;
  status: string;
}) {
  const tone = status === 'Critique' ? 'danger' : status === 'Faible' ? 'warning' : 'success';

  return (
    <Pressable style={({ pressed }: { pressed: boolean }) => [styles.productTile, pressed && styles.pressed]}>
      <View style={styles.productBadge}>
        <ThemedText type="smallBold">{name.slice(0, 1)}</ThemedText>
      </View>
      <View style={styles.productInfo}>
        <View style={styles.rowBetween}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {name}
          </ThemedText>
          <StatusPill tone={tone}>{status}</StatusPill>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {meta}
        </ThemedText>
        <ThemedText selectable style={styles.productPrice}>
          {price}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CheckoutPanel({ children }: { children: ReactNode }) {
  return <ThemedView style={styles.checkoutPanel}>{children}</ThemedView>;
}

export function FormField({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.formField}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </ThemedView>
  );
}

export function StatusPill({ children, tone = 'primary' }: { children: ReactNode; tone?: Tone }) {
  return (
    <View style={[styles.statusPill, statusStyles[tone]]}>
      <ThemedText type="smallBold" style={[styles.statusText, statusTextStyles[tone]]}>
        {children}
      </ThemedText>
    </View>
  );
}

type Accent = 'primary' | 'success' | 'warning' | 'danger';
type Tone = 'primary' | 'success' | 'warning' | 'danger';

const accentToTone: Record<Accent, Tone> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

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
      <ThemedText type="smallBold" style={[styles.roleText, selected && styles.roleButtonTextSelected]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const accentBorderStyles = StyleSheet.create({
  primary: { borderLeftColor: '#6D5DF6' },
  success: { borderLeftColor: '#11B66D' },
  warning: { borderLeftColor: '#D98200' },
  danger: { borderLeftColor: '#E5484D' },
});

const toneStyles = StyleSheet.create({
  primary: { color: '#5E4CE6' },
  success: { color: '#087F5B' },
  warning: { color: '#A35C00' },
  danger: { color: '#C92A2A' },
});

const statusStyles = StyleSheet.create({
  primary: { backgroundColor: '#EFECFF' },
  success: { backgroundColor: '#E7F8EF' },
  warning: { backgroundColor: '#FFF3D8' },
  danger: { backgroundColor: '#FFE8E8' },
});

const statusTextStyles = StyleSheet.create({
  primary: { color: '#5E4CE6' },
  success: { color: '#087F5B' },
  warning: { color: '#A35C00' },
  danger: { color: '#C92A2A' },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    minHeight: '100%',
    padding: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: 118,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101828',
  },
  avatarText: {
    color: '#FFFFFF',
  },
  header: {
    gap: Spacing.one,
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  screenTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 25,
  },
  heroMetric: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: Spacing.three,
    minHeight: 118,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderColor: '#E7EAF0',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    boxShadow: '0 16px 35px rgba(16, 24, 40, 0.08)',
  },
  metricCopy: {
    flex: 1,
    gap: Spacing.two,
  },
  heroValue: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: 8,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
    borderLeftWidth: 5,
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7EAF0',
  },
  actionText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  row: {
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  sectionHeader: {
    paddingTop: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
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
    borderRadius: 4,
    backgroundColor: '#6D5DF6',
  },
  roleSwitch: {
    flex: 1,
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
  roleText: {
    textAlign: 'center',
  },
  roleButtonTextSelected: {
    color: '#FFFFFF',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    lineHeight: 14,
  },
  productTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    padding: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  productBadge: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F0F0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  productPrice: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  checkoutPanel: {
    backgroundColor: '#101828',
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  formField: {
    flex: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: 4,
  },
});
