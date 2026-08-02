import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/lib/theme';

import type { TodaySummary } from '@/lib/control-data';

export function parseClosureAmount(value: string) {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return Number.NaN;

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function formatClosureMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function ClosureSummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View
      style={{
        minHeight: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
      }}
    >
      <Text style={{ flex: 1, color: colors.gray600, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          maxWidth: '52%',
          color: muted ? colors.gray500 : colors.gray900,
          fontSize: 14,
          fontWeight: '900',
          textAlign: 'right',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function ClosureMetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 86,
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: accent ? colors.primarySoft : colors.gray50,
        borderWidth: 1,
        borderColor: accent ? colors.primaryDisabled : colors.gray100,
        padding: 16,
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '700' }}>
        {label}
      </Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: colors.gray900,
          fontSize: accent ? 25 : 21,
          fontWeight: '900',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function ClosureForm({
  summary,
  note,
  saving,
  formError,
  successMessage,
  onNoteChange,
  onSubmit,
}: {
  summary: TodaySummary;
  note: string;
  saving: boolean;
  formError: string;
  successMessage: string;
  onNoteChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const totalSales = summary.cashSalesAmount + summary.mobileMoneySalesAmount;
  const netCash = summary.physicalCashExpected;
  const disabled = saving || summary.isClosed;

  return (
    <View style={{ marginTop: 24, gap: 15 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ClosureMetricCard label="Total journee" value={formatClosureMoney(totalSales)} accent />
        <ClosureMetricCard label="Ventes" value={String(summary.salesCount)} />
      </View>

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600' }}>Note</Text>
        <TextInput
          value={note}
          onChangeText={onNoteChange}
          placeholder="Commentaire de fin de journee"
          placeholderTextColor={colors.gray400}
          style={{
            minHeight: 54,
            borderRadius: 18,
            borderCurve: 'continuous',
            backgroundColor: colors.gray50,
            borderWidth: 1,
            borderColor: colors.gray100,
            paddingHorizontal: 16,
            color: colors.gray900,
            fontSize: 16,
            fontWeight: '600',
          }}
        />
      </View>

      <View
        style={{
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: colors.gray50,
          borderWidth: 1,
          borderColor: colors.gray100,
          padding: 18,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <Feather name="clipboard" size={17} color={colors.gray600} />
          <Text style={{ color: colors.gray900, fontSize: 16, fontWeight: '900' }}>
            Detail de la journee
          </Text>
        </View>

        <View style={{ gap: 2 }}>
          <ClosureSummaryRow label="Ventes cash" value={formatClosureMoney(summary.cashSalesAmount)} />
          <ClosureSummaryRow
            label="Mobile Money"
            value={formatClosureMoney(summary.mobileMoneySalesAmount)}
          />
          <ClosureSummaryRow
            label="Depenses"
            value={summary.expensesAmount === 0 ? formatClosureMoney(0) : `-${formatClosureMoney(summary.expensesAmount)}`}
            muted={summary.expensesAmount === 0}
          />
          <ClosureSummaryRow
            label="Cash net"
            value={formatClosureMoney(netCash)}
          />
        </View>

        {summary.closureCount > 0 ? (
          <Text style={{ color: colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' }}>
            {summary.closureCount === 1
              ? 'Une cloture existe deja pour cette journee.'
              : `${summary.closureCount} clotures existent deja pour cette journee.`}
          </Text>
        ) : null}
      </View>

      {formError ? (
        <Text selectable style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>
          {formError}
        </Text>
      ) : null}

      {successMessage ? (
        <Text selectable style={{ color: colors.successMuted, fontSize: 13, fontWeight: '700' }}>
          {successMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        disabled={disabled}
        style={({ pressed }: { pressed: boolean }) => ({
          height: 54,
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: disabled ? colors.primaryDisabled : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
          opacity: pressed && !disabled ? 0.76 : 1,
        })}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Feather name="check-circle" size={20} color={colors.white} />
        )}
        <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>
          {summary.isClosed ? 'Journee cloturee' : 'Cloturer la journee'}
        </Text>
      </Pressable>
    </View>
  );
}
