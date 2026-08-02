import { useControlAuth } from '@/lib/control-auth';
import { updateCurrentShop } from '@/lib/control-data';
import { getControlErrorMessage } from '@/lib/control-errors';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { needsShopSetup } from '../utils';
import { colors } from '@/lib/theme';

export function ShopSettingsModal({
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
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible || !session) return;

    setName(needsShopSetup(session) ? '' : session.shop.name);
    setContact(session.shop.contact ?? '');
    setAddress(session.shop.address ?? '');
    setOpeningHours(session.shop.openingHours ?? '');
    setErrorMessage('');
  }, [session, visible]);

  async function handleSave() {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setErrorMessage('Donne un nom de boutique plus complet.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await updateCurrentShop({
        name: trimmedName,
        contact,
        address,
        openingHours,
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
            backgroundColor: colors.white,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: colors.gray900, fontSize: 22, fontWeight: '800' }}>Boutique</Text>
              <Text style={{ color: colors.gray600, fontSize: 13 }}>
                Nom et informations visibles dans CONTROL
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.gray50,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color={colors.gray900} />
            </Pressable>
          </View>

          {[
            { label: 'Nom de la boutique', value: name, onChangeText: setName, placeholder: 'Ex. Chez Awa' },
            { label: 'Contact', value: contact, onChangeText: setContact, placeholder: 'Téléphone ou WhatsApp' },
            { label: 'Adresse', value: address, onChangeText: setAddress, placeholder: 'Quartier, marché, rue' },
            { label: 'Horaires', value: openingHours, onChangeText: setOpeningHours, placeholder: 'Ex. 8h - 20h' },
          ].map((field) => (
            <View key={field.label} style={{ gap: 7 }}>
              <Text style={{ color: colors.gray700, fontSize: 13, fontWeight: '700' }}>{field.label}</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChangeText}
                placeholder={field.placeholder}
                placeholderTextColor={colors.gray400}
                style={{
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: colors.gray50,
                  paddingHorizontal: 16,
                  color: colors.gray900,
                  fontSize: 16,
                  fontWeight: field.label === 'Nom de la boutique' ? '700' : '500',
                }}
              />
            </View>
          ))}

          {errorMessage ? (
            <Text style={{ color: colors.dangerDark, fontSize: 13, fontWeight: '700' }}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 56,
              borderRadius: 16,
              backgroundColor: colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || saving ? 0.72 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={{ color: colors.white, fontSize: 17, fontWeight: '800' }}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
