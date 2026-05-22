import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

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
        borderTopColor: '#F0F0F0',
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Quantite</Text>
          <TextInput
            value={quantity}
            onChangeText={onQuantityChange}
            placeholder="0"
            placeholderTextColor="#B4B4B4"
            keyboardType="decimal-pad"
            style={{
              height: 54,
              borderRadius: 18,
              borderCurve: 'continuous',
              backgroundColor: '#F7F7F7',
              borderWidth: 1,
              borderColor: '#EEEEEE',
              paddingHorizontal: 16,
              color: '#111111',
              fontSize: 22,
              fontWeight: '800',
            }}
          />
        </View>

        <View style={{ flex: 1, gap: 7 }}>
          <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Paiement</Text>
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
                    backgroundColor: selected ? '#111111' : '#F2F2F2',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.72 : 1,
                  })}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: selected ? '#FFFFFF' : '#777777',
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
          borderRadius: 20,
          borderCurve: 'continuous',
          backgroundColor: '#F7F7F7',
          borderWidth: 1,
          borderColor: '#EFEFEF',
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: '#777777', fontSize: 14, fontWeight: '700' }}>Total</Text>
        <TextInput
          value={totalInput}
          onChangeText={onTotalInputChange}
          placeholder={formatSaleMoney(autoTotal)}
          placeholderTextColor="#B4B4B4"
          keyboardType="number-pad"
          style={{
            color: '#111111',
            fontSize: 24,
            fontWeight: '900',
            textAlign: 'right',
            minWidth: 120,
          }}
        />
      </View>

      {formError ? (
        <Text style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>{formError}</Text>
      ) : null}

      {successMessage ? (
        <Text style={{ color: '#2A8D55', fontSize: 13, fontWeight: '700' }}>{successMessage}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        disabled={saving}
        style={({ pressed }: { pressed: boolean }) => ({
          height: 54,
          borderRadius: 20,
          borderCurve: 'continuous',
          backgroundColor: saving ? '#9FCAEF' : '#2A8DEB',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
          opacity: pressed ? 0.76 : 1,
          marginBottom: 8,
        })}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Feather name="arrow-up-right" size={20} color="#FFFFFF" />
        )}
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
          Valider la vente
        </Text>
      </Pressable>
    </View>
  );
}
