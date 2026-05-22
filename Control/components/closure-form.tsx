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

export function ClosureForm({
  summary,
  physicalCashAmount,
  note,
  isPartial,
  saving,
  formError,
  successMessage,
  onPhysicalCashAmountChange,
  onNoteChange,
  onPartialChange,
  onSubmit,
}: {
  summary: TodaySummary;
  physicalCashAmount: string;
  note: string;
  isPartial: boolean;
  saving: boolean;
  formError: string;
  successMessage: string;
  onPhysicalCashAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPartialChange: (value: boolean) => void;
  onSubmit: () => void;
}) {
  const hasPhysicalCashInput = physicalCashAmount.trim().length > 0;
  const parsedPhysicalCash = parseClosureAmount(physicalCashAmount);
  const canCalculateGap = hasPhysicalCashInput && !Number.isNaN(parsedPhysicalCash);
  const cashGap = canCalculateGap ? parsedPhysicalCash - summary.physicalCashExpected : 0;
  const disabled = saving || !canCalculateGap || parsedPhysicalCash < 0;

  return (
    <View style={{ marginTop: 26, gap: 15 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            flex: 1,
            minHeight: 86,
            borderRadius: 24,
            borderCurve: 'continuous',
            backgroundColor: '#F7F7F7',
            borderWidth: 1,
            borderColor: '#EFEFEF',
            padding: 16,
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#777777', fontSize: 13, fontWeight: '700' }}>
            Cash attendu
          </Text>
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: '#111111',
              fontSize: 22,
              fontWeight: '900',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatClosureMoney(summary.physicalCashExpected)}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            minHeight: 86,
            borderRadius: 24,
            borderCurve: 'continuous',
            backgroundColor: '#F7F7F7',
            borderWidth: 1,
            borderColor: '#EFEFEF',
            padding: 16,
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#777777', fontSize: 13, fontWeight: '700' }}>
            Dernier ecart
          </Text>
          <Text
            selectable
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: summary.latestCashGap === 0 ? '#111111' : '#E5484D',
              fontSize: 22,
              fontWeight: '900',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatClosureMoney(summary.latestCashGap)}
          </Text>
        </View>
      </View>

      <View style={{ gap: 7 }}>
        <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>
          Cash compte
        </Text>
        <TextInput
          value={physicalCashAmount}
          onChangeText={onPhysicalCashAmountChange}
          placeholder="0 F"
          placeholderTextColor="#B4B4B4"
          keyboardType="number-pad"
          style={{
            minHeight: 54,
            borderRadius: 18,
            borderCurve: 'continuous',
            backgroundColor: '#F7F7F7',
            borderWidth: 1,
            borderColor: '#EEEEEE',
            paddingHorizontal: 16,
            color: '#111111',
            fontSize: 18,
            fontWeight: '800',
          }}
        />
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

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: isPartial }}
        onPress={() => onPartialChange(!isPartial)}
        style={({ pressed }: { pressed: boolean }) => ({
          minHeight: 52,
          borderRadius: 18,
          borderCurve: 'continuous',
          backgroundColor: isPartial ? '#FFF8E7' : '#F7F7F7',
          borderWidth: 1,
          borderColor: isPartial ? '#FFD580' : '#EEEEEE',
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: '#111111', fontSize: 14, fontWeight: '800' }}>
            Cloture partielle
          </Text>
          <Text style={{ color: '#9A9A9A', fontSize: 12, fontWeight: '600' }}>
            Changement d&apos;equipe ou fermeture en cours de journee
          </Text>
        </View>
        <View
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            backgroundColor: isPartial ? '#F59E0B' : '#CCCCCC',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              alignSelf: isPartial ? 'flex-end' : 'flex-start',
            }}
          />
        </View>
      </Pressable>

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
            Resume avant confirmation
          </Text>
        </View>

        <View style={{ gap: 2 }}>
          <ClosureSummaryRow label="Ventes cash" value={formatClosureMoney(summary.cashSalesAmount)} />
          <ClosureSummaryRow
            label="Sorties caisse"
            value={summary.expensesAmount === 0 ? formatClosureMoney(0) : `-${formatClosureMoney(summary.expensesAmount)}`}
            muted={summary.expensesAmount === 0}
          />
          <ClosureSummaryRow
            label="Cash attendu en caisse"
            value={formatClosureMoney(summary.physicalCashExpected)}
          />
          <ClosureSummaryRow
            label="Mobile Money suivi"
            value={formatClosureMoney(summary.mobileMoneySalesAmount)}
            muted
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

      <View
        style={{
          minHeight: 82,
          borderRadius: 24,
          borderCurve: 'continuous',
          backgroundColor: !canCalculateGap || cashGap === 0 ? '#F7F7F7' : '#FFF5F5',
          borderWidth: 1,
          borderColor: !canCalculateGap || cashGap === 0 ? '#EFEFEF' : '#FFD7D9',
          padding: 18,
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: '#777777', fontSize: 14, fontWeight: '700' }}>
          Ecart calcule
        </Text>
        <Text
          selectable
          style={{
            color: !canCalculateGap ? '#A4A4A4' : cashGap === 0 ? '#111111' : '#E5484D',
            fontSize: canCalculateGap ? 26 : 18,
            lineHeight: 31,
            fontWeight: canCalculateGap ? '900' : '700',
            fontVariant: ['tabular-nums'],
          }}
        >
          {canCalculateGap ? formatClosureMoney(cashGap) : 'En attente du cash compte'}
        </Text>
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
          opacity: pressed && canCalculateGap ? 0.76 : 1,
        })}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Feather name="check-circle" size={20} color="#FFFFFF" />
        )}
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
          Cloturer la caisse
        </Text>
      </Pressable>
    </View>
  );
}
