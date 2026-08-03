import { useControlAuth } from '@/lib/control-auth';
import { getShopLogoUri, updateCurrentShop } from '@/lib/control-data';
import { getControlErrorMessage } from '@/lib/control-errors';
import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { getInitials, needsShopSetup } from '../utils';
import { colors } from '@/lib/theme';

type LogoPhoto = { uri: string; base64: string; mimeType: string };

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
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoPhoto, setLogoPhoto] = useState<LogoPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible || !session) return;

    setName(needsShopSetup(session) ? '' : session.shop.name);
    setContact(session.shop.contact ?? '');
    setAddress(session.shop.address ?? '');
    setOpeningHours(session.shop.openingHours ?? '');
    setLogoPhoto(null);
    setErrorMessage('');

    if (session.shop.logoFileId) {
      getShopLogoUri().then(setLogoUri).catch(() => setLogoUri(null));
    } else {
      setLogoUri(null);
    }
  }, [session, visible]);

  async function pickLogoPhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission refusée',
        source === 'camera'
          ? "Autorise l'accès à la caméra pour prendre une photo."
          : "Autorise l'accès aux photos pour en choisir une."
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images',
      base64: true,
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    setLogoPhoto({ uri: asset.uri, base64: asset.base64!, mimeType: asset.mimeType || 'image/jpeg' });
  }

  function choosePhotoSource() {
    Alert.alert('Photo de la boutique', undefined, [
      { text: 'Caméra', onPress: () => pickLogoPhoto('camera') },
      { text: 'Galerie', onPress: () => pickLogoPhoto('library') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

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
        logoPhoto: logoPhoto ? { base64: logoPhoto.base64, mimeType: logoPhoto.mimeType } : undefined,
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable
              onPress={choosePhotoSource}
              style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.72 : 1 })}
            >
              {logoPhoto || logoUri ? (
                <Image
                  source={{ uri: logoPhoto?.uri ?? logoUri ?? undefined }}
                  style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.gray100 }}
                />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '800' }}>
                    {getInitials(name || 'Boutique')}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={choosePhotoSource}
              style={({ pressed }: { pressed: boolean }) => ({
                position: 'absolute',
                left: 40,
                top: 40,
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <Feather name="camera" size={12} color={colors.white} />
            </Pressable>
            <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => pickLogoPhoto('camera')}
                style={({ pressed }: { pressed: boolean }) => ({
                  flex: 1,
                  height: 40,
                  borderRadius: 13,
                  backgroundColor: colors.gray50,
                  borderWidth: 1,
                  borderColor: colors.gray100,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Feather name="camera" size={13} color={colors.gray600} />
                <Text style={{ color: colors.gray600, fontSize: 12, fontWeight: '700' }}>Caméra</Text>
              </Pressable>
              <Pressable
                onPress={() => pickLogoPhoto('library')}
                style={({ pressed }: { pressed: boolean }) => ({
                  flex: 1,
                  height: 40,
                  borderRadius: 13,
                  backgroundColor: colors.gray50,
                  borderWidth: 1,
                  borderColor: colors.gray100,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Feather name="image" size={13} color={colors.gray600} />
                <Text style={{ color: colors.gray600, fontSize: 12, fontWeight: '700' }}>Galerie</Text>
              </Pressable>
            </View>
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
              backgroundColor: colors.primary,
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
