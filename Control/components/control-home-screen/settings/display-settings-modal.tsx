import { useControlAuth } from '@/lib/control-auth';
import { updateCurrentShop, type ProductUnit } from '@/lib/control-data';
import { getControlErrorMessage } from '@/lib/control-errors';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { isAmountsVisibleByDefault } from '../utils';

export function DisplaySettingsModal({
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
  const [amountsVisibleByDefault, setAmountsVisibleByDefault] = useState(true);
  const [displayLanguage, setDisplayLanguage] = useState<'fr' | 'en'>('fr');
  const [defaultUnit, setDefaultUnit] = useState<ProductUnit>('piece');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const languages: { label: string; value: 'fr' | 'en' }[] = [
    { label: 'Français', value: 'fr' },
    { label: 'English', value: 'en' },
  ];
  const units: { label: string; value: ProductUnit }[] = [
    { label: 'kg', value: 'kg' },
    { label: 'pièce', value: 'piece' },
    { label: 'carton', value: 'carton' },
    { label: 'tas', value: 'tas' },
    { label: 'unité', value: 'unite' },
  ];

  useEffect(() => {
    if (!visible || !session) return;

    const language = session.shop.displayLanguage === 'en' ? 'en' : 'fr';
    const validUnits: ProductUnit[] = ['kg', 'piece', 'carton', 'tas', 'unite'];
    const unit = validUnits.includes(session.shop.defaultUnit as ProductUnit)
      ? (session.shop.defaultUnit as ProductUnit)
      : 'piece';

    setAmountsVisibleByDefault(isAmountsVisibleByDefault(session.shop.amountsVisibleByDefault));
    setDisplayLanguage(language);
    setDefaultUnit(unit);
    setErrorMessage('');
  }, [session, visible]);

  async function handleSave() {
    setSaving(true);
    setErrorMessage('');

    try {
      await updateCurrentShop({
        amountsVisibleByDefault,
        displayLanguage,
        defaultUnit,
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
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Affichage</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                Montants, langue et unités
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
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Montants</Text>
            <Pressable
              onPress={() => setAmountsVisibleByDefault((visible) => !visible)}
              style={({ pressed }: { pressed: boolean }) => ({
                minHeight: 52,
                borderRadius: 18,
                backgroundColor: '#F7F7F7',
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>
                  Visibles au démarrage
                </Text>
                <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                  {"Tu peux toujours masquer avec l'icône œil"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={amountsVisibleByDefault ? 'check-circle' : 'circle-outline'}
                size={24}
                color={amountsVisibleByDefault ? '#08784F' : '#A8A8A8'}
              />
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Langue</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {languages.map((item) => {
                const selected = displayLanguage === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setDisplayLanguage(item.value)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      flex: 1,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: selected ? '#050505' : '#F7F7F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Text style={{ color: selected ? '#FFFFFF' : '#111111', fontSize: 14, fontWeight: '800' }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Unité par défaut</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {units.map((item) => {
                const selected = defaultUnit === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setDefaultUnit(item.value)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: 42,
                      minWidth: 76,
                      paddingHorizontal: 15,
                      borderRadius: 21,
                      backgroundColor: selected ? '#050505' : '#F7F7F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Text style={{ color: selected ? '#FFFFFF' : '#111111', fontSize: 14, fontWeight: '800' }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
