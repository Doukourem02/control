import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Tone = 'primary' | 'success' | 'warning' | 'danger';

const toneColors: Record<Tone, { background: string; text: string; soft: string }> = {
  primary: { background: '#111111', text: '#FFFFFF', soft: '#EDE8F7' },
  success: { background: '#0B8F5A', text: '#FFFFFF', soft: '#E8F6EF' },
  warning: { background: '#E8A018', text: '#111111', soft: '#FFF4D9' },
  danger: { background: '#D94841', text: '#FFFFFF', soft: '#FDEDEC' },
};

export function ControlScreen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <Link href="/" asChild>
          <Pressable style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        </Link>
        <View style={styles.pageTitleBlock}>
          <Text style={styles.pageTitle}>{title}</Text>
          {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </ScrollView>
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
  accent?: Tone;
}) {
  const tone = toneColors[accent];

  return (
    <View style={[styles.heroMetric, { backgroundColor: tone.soft }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.heroValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  accent = 'primary',
}: {
  label: string;
  value: string;
  accent?: Tone;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: toneColors[accent].background }]}>{value}</Text>
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function ActionButton({ label, href }: { label: string; href?: Href }) {
  const content = (
    <Pressable style={({ pressed }: { pressed: boolean }) => [styles.actionButton, pressed && styles.pressed]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} asChild>
      {content}
    </Link>
  );
}

export function ListRow({
  title,
  meta,
  value,
  tone = 'primary',
}: {
  title: string;
  meta?: string;
  value?: string;
  tone?: Tone;
}) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listCopy}>
        <Text style={styles.listTitle}>{title}</Text>
        {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
      </View>
      {value ? <Text style={[styles.listValue, { color: toneColors[tone].background }]}>{value}</Text> : null}
    </View>
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
  const isCritical = status.toLowerCase().includes('critique');

  return (
    <View style={styles.productTile}>
      <View style={styles.productMark} />
      <View style={styles.listCopy}>
        <Text style={styles.listTitle}>{name}</Text>
        <Text style={styles.listMeta}>{meta}</Text>
      </View>
      <View style={styles.productRight}>
        <Text style={styles.listValue}>{price}</Text>
        <StatusPill tone={isCritical ? 'danger' : 'success'}>{status}</StatusPill>
      </View>
    </View>
  );
}

export function FormField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.formValue}>{value}</Text>
    </View>
  );
}

export function CheckoutPanel({ children }: { children: ReactNode }) {
  return <View style={styles.checkoutPanel}>{children}</View>;
}

export function StatusPill({ children, tone = 'primary' }: { children: ReactNode; tone?: Tone }) {
  const colors = toneColors[tone];

  return (
    <View style={[styles.statusPill, { backgroundColor: colors.background }]}>
      <Text style={[styles.statusText, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

export function MiniChart({ values }: { values: number[] }) {
  const max = Math.max(...values);

  return (
    <View style={styles.chart}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.chartColumn}>
          <View style={[styles.chartBar, { height: `${Math.max(18, (value / max) * 100)}%` }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 18,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#111111',
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '700',
  },
  pageTitleBlock: {
    flex: 1,
    gap: 4,
  },
  pageTitle: {
    color: '#111111',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  pageSubtitle: {
    color: '#787878',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  heroMetric: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  metricLabel: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  heroValue: {
    color: '#111111',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  metricDetail: {
    color: '#555555',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  metricCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    padding: 16,
    justifyContent: 'space-between',
  },
  metricValue: {
    color: '#111111',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  sectionAction: {
    color: '#7E7E7E',
    fontSize: 13,
    fontWeight: '800',
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  listRow: {
    minHeight: 76,
    borderRadius: 18,
    backgroundColor: '#F6F6F6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listCopy: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    color: '#1A1A1A',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  listMeta: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  listValue: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'right',
  },
  productTile: {
    minHeight: 88,
    borderRadius: 18,
    backgroundColor: '#F6F6F6',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productMark: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EDE8F7',
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 7,
  },
  formField: {
    flex: 1,
    minHeight: 78,
    borderRadius: 18,
    backgroundColor: '#F6F6F6',
    padding: 15,
    justifyContent: 'space-between',
  },
  formValue: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  checkoutPanel: {
    borderRadius: 22,
    backgroundColor: '#F4F0FA',
    padding: 18,
    gap: 16,
  },
  statusPill: {
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
  },
  chart: {
    height: 170,
    borderRadius: 20,
    backgroundColor: '#F6F6F6',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  chartColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    borderRadius: 99,
    backgroundColor: '#111111',
  },
});
