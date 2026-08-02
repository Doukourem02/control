import { useControlAuth } from '@/lib/control-auth';
import { updateCurrentShop } from '@/lib/control-data';
import { getControlErrorMessage } from '@/lib/control-errors';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { PreferenceToggle } from '../shared-ui';
import { isPreferenceEnabled } from '../utils';

export function AlertsSettingsModal({
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
  const [stockLowAlertsEnabled, setStockLowAlertsEnabled] = useState(true);
  const [closureReminderEnabled, setClosureReminderEnabled] = useState(true);
  const [cashGapAlertsEnabled, setCashGapAlertsEnabled] = useState(true);
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState('5');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible || !session) return;

    setStockLowAlertsEnabled(isPreferenceEnabled(session.shop.stockLowAlertsEnabled));
    setClosureReminderEnabled(isPreferenceEnabled(session.shop.closureReminderEnabled));
    setCashGapAlertsEnabled(isPreferenceEnabled(session.shop.cashGapAlertsEnabled));
    setDefaultLowStockThreshold(session.shop.defaultLowStockThreshold || '5');
    setErrorMessage('');
  }, [session, visible]);

  async function handleSave() {
    const threshold = defaultLowStockThreshold.trim();

    if (!/^\d+$/.test(threshold) || Number(threshold) < 1 || Number(threshold) > 999) {
      setErrorMessage('Renseigne un seuil entre 1 et 999.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await updateCurrentShop({
        stockLowAlertsEnabled,
        closureReminderEnabled,
        cashGapAlertsEnabled,
        defaultLowStockThreshold: String(Number(threshold)),
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
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Alertes</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                Préférences avant les notifications
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
            <PreferenceToggle
              title="Stock faible"
              subtitle="Signaler les produits sous le seuil"
              enabled={stockLowAlertsEnabled}
              onToggle={() => setStockLowAlertsEnabled((enabled) => !enabled)}
            />
            <PreferenceToggle
              title="Clôture oubliée"
              subtitle="Préparer le rappel de fin de journée"
              enabled={closureReminderEnabled}
              onToggle={() => setClosureReminderEnabled((enabled) => !enabled)}
            />
            <PreferenceToggle
              title="Écart de caisse"
              subtitle="Mettre en avant les écarts détectés"
              enabled={cashGapAlertsEnabled}
              onToggle={() => setCashGapAlertsEnabled((enabled) => !enabled)}
            />
          </View>

          <View style={{ gap: 7 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Seuil stock faible</Text>
            <TextInput
              value={defaultLowStockThreshold}
              onChangeText={setDefaultLowStockThreshold}
              placeholder="5"
              placeholderTextColor="#A8A8A8"
              keyboardType="number-pad"
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
