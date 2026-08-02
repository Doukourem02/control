import { useControlAuth } from '@/lib/control-auth';
import { updateCurrentShop } from '@/lib/control-data';
import { getControlErrorMessage } from '@/lib/control-errors';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { readPaymentMethods } from '../utils';

export function CashSettingsModal({
  visible,
  compact,
  onClose,
  onSaved,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { session } = useControlAuth();
  const [currency, setCurrency] = useState('FCFA');
  const [cashEnabled, setCashEnabled] = useState(true);
  const [mobileMoneyEnabled, setMobileMoneyEnabled] = useState(true);
  const [defaultClosingTime, setDefaultClosingTime] = useState('20:00');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const currencies = ['FCFA', 'GNF', 'EUR', 'USD'];

  useEffect(() => {
    if (!visible || !session) return;

    const paymentMethods = readPaymentMethods(session.shop.paymentMethods);
    setCurrency(session.shop.currency || 'FCFA');
    setCashEnabled(paymentMethods.includes('Cash'));
    setMobileMoneyEnabled(paymentMethods.includes('Mobile Money'));
    setDefaultClosingTime(session.shop.defaultClosingTime || '20:00');
    setErrorMessage('');
  }, [session, visible]);

  async function handleSave() {
    const paymentMethods = [
      ...(cashEnabled ? ['Cash'] : []),
      ...(mobileMoneyEnabled ? ['Mobile Money'] : []),
    ];

    if (paymentMethods.length === 0) {
      setErrorMessage('Active au moins un mode de paiement.');
      return;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(defaultClosingTime.trim())) {
      setErrorMessage('Renseigne une heure au format HH:MM.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await updateCurrentShop({
        currency,
        paymentMethods,
        defaultClosingTime: defaultClosingTime.trim(),
      });
      await onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(getControlErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.24)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Caisse</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                Devise, paiements et clôture
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color="#111111" />
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Devise</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {currencies.map((item) => {
                const selected = currency === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setCurrency(item)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: 42,
                      paddingHorizontal: 16,
                      borderRadius: 21,
                      backgroundColor: selected ? '#050505' : '#F7F7F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Text style={{ color: selected ? '#FFFFFF' : '#111111', fontSize: 14, fontWeight: '800' }}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Modes de paiement</Text>
            {[
              { label: 'Cash', enabled: cashEnabled, onToggle: setCashEnabled },
              { label: 'Mobile Money', enabled: mobileMoneyEnabled, onToggle: setMobileMoneyEnabled },
            ].map((method) => (
              <Pressable
                key={method.label}
                onPress={() => method.onToggle(!method.enabled)}
                style={({ pressed }: { pressed: boolean }) => ({
                  minHeight: 48,
                  borderRadius: 16,
                  backgroundColor: '#F7F7F7',
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>{method.label}</Text>
                <MaterialCommunityIcons
                  name={method.enabled ? 'check-circle' : 'circle-outline'}
                  size={23}
                  color={method.enabled ? '#08784F' : '#A8A8A8'}
                />
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 7 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Heure de clôture par défaut</Text>
            <TextInput
              value={defaultClosingTime}
              onChangeText={setDefaultClosingTime}
              placeholder="20:00"
              placeholderTextColor="#A8A8A8"
              keyboardType="numbers-and-punctuation"
              style={{
                height: 52,
                borderRadius: 18,
                backgroundColor: '#F7F7F7',
                paddingHorizontal: 16,
                color: '#111111',
                fontSize: 16,
                fontWeight: '700',
              }}
            />
          </View>

          {errorMessage ? (
            <Text style={{ color: '#B42318', fontSize: 13, fontWeight: '700' }}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 56,
              borderRadius: 22,
              backgroundColor: '#050505',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || saving ? 0.72 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
