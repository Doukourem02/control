import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@/lib/theme';

import type { PaymentMethod } from '@/lib/control-data';

export function formatSaleMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

export function SaleForm({
  quantity,
  totalInput,
  autoTotal,
  paymentMethod,
  availablePaymentMethods,
  formError,
  successMessage,
  saving,
  onQuantityChange,
  onTotalInputChange,
  onPaymentMethodChange,
  onSubmit,
}: {
  quantity: string;
  totalInput: string;
  autoTotal: number;
  paymentMethod: PaymentMethod;
  availablePaymentMethods: PaymentMethod[];
  formError: string;
  successMessage: string;
  saving: boolean;
  onQuantityChange: (value: string) => void;
  onTotalInputChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onSubmit: () => void;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 8,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600' }}>Quantite</Text>
          <TextInput
            value={quantity}
            onChangeText={onQuantityChange}
            placeholder="0"
            placeholderTextColor={colors.gray400}
            keyboardType="decimal-pad"
            style={{
              height: 54,
              borderRadius: 18,
              borderCurve: 'continuous',
              backgroundColor: colors.gray50,
              borderWidth: 1,
              borderColor: colors.gray100,
              paddingHorizontal: 16,
              color: colors.gray900,
              fontSize: 22,
              fontWeight: '800',
            }}
          />
        </View>

        <View style={{ flex: 1, gap: 7 }}>
          <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '600' }}>Paiement</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {availablePaymentMethods.map((method) => {
              const selected = paymentMethod === method;
              return (
                <Pressable
                  key={method}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onPaymentMethodChange(method)}
                  style={({ pressed }: { pressed: boolean }) => ({
                    flex: 1,
                    height: 54,
                    borderRadius: 18,
                    borderCurve: 'continuous',
                    backgroundColor: selected ? colors.gray900 : colors.gray100,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.72 : 1,
                  })}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: selected ? colors.white : colors.gray600,
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    {method}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View
        style={{
          height: 58,
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: colors.gray50,
          borderWidth: 1,
          borderColor: colors.gray100,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: colors.gray600, fontSize: 14, fontWeight: '700' }}>Total</Text>
        <TextInput
          value={totalInput}
          onChangeText={onTotalInputChange}
          placeholder={formatSaleMoney(autoTotal)}
          placeholderTextColor={colors.gray400}
          keyboardType="number-pad"
          style={{
            color: colors.gray900,
            fontSize: 24,
            fontWeight: '900',
            textAlign: 'right',
            minWidth: 120,
          }}
        />
      </View>

      {formError ? (
        <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>{formError}</Text>
      ) : null}

      {successMessage ? (
        <Text style={{ color: colors.successMuted, fontSize: 13, fontWeight: '700' }}>{successMessage}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        disabled={saving}
        style={({ pressed }: { pressed: boolean }) => ({
          height: 54,
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: saving ? colors.primaryDisabled : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
          opacity: pressed ? 0.76 : 1,
          marginBottom: 8,
        })}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Feather name="arrow-up-right" size={20} color={colors.white} />
        )}
        <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>
          Valider la vente
        </Text>
      </Pressable>
    </View>
  );
}
