import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

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
      <Text style={{ flex: 1, color: '#777777', fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          maxWidth: '52%',
          color: muted ? '#9A9A9A' : '#111111',
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
        borderRadius: 22,
        borderCurve: 'continuous',
        backgroundColor: accent ? '#EFF7FF' : '#F7F7F7',
        borderWidth: 1,
        borderColor: accent ? '#CDE7FF' : '#EFEFEF',
        padding: 16,
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: '#777777', fontSize: 13, fontWeight: '700' }}>
        {label}
      </Text>
      <Text
        selectable
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: '#111111',
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
        <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Note</Text>
        <TextInput
          value={note}
          onChangeText={onNoteChange}
          placeholder="Commentaire de fin de journee"
          placeholderTextColor="#B4B4B4"
          style={{
            minHeight: 54,
            borderRadius: 18,
            borderCurve: 'continuous',
            backgroundColor: '#F7F7F7',
            borderWidth: 1,
            borderColor: '#EEEEEE',
            paddingHorizontal: 16,
            color: '#111111',
            fontSize: 16,
            fontWeight: '600',
          }}
        />
      </View>

      <View
        style={{
          borderRadius: 24,
          borderCurve: 'continuous',
          backgroundColor: '#F7F7F7',
          borderWidth: 1,
          borderColor: '#EFEFEF',
          padding: 18,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <Feather name="clipboard" size={17} color="#777777" />
          <Text style={{ color: '#111111', fontSize: 16, fontWeight: '900' }}>
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
          <Text style={{ color: '#E5484D', fontSize: 12, lineHeight: 17, fontWeight: '700' }}>
            {summary.closureCount === 1
              ? 'Une cloture existe deja pour cette journee.'
              : `${summary.closureCount} clotures existent deja pour cette journee.`}
          </Text>
        ) : null}
      </View>

      {formError ? (
        <Text selectable style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>
          {formError}
        </Text>
      ) : null}

      {successMessage ? (
        <Text selectable style={{ color: '#2A8D55', fontSize: 13, fontWeight: '700' }}>
          {successMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        disabled={disabled}
        style={({ pressed }: { pressed: boolean }) => ({
          height: 54,
          borderRadius: 20,
          borderCurve: 'continuous',
          backgroundColor: disabled ? '#9FCAEF' : '#2A8DEB',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
          opacity: pressed && !disabled ? 0.76 : 1,
        })}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Feather name="check-circle" size={20} color="#FFFFFF" />
        )}
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
          {summary.isClosed ? 'Journee cloturee' : 'Cloturer la journee'}
        </Text>
      </Pressable>
    </View>
  );
}
