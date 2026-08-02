import { createStore, listMyStores, switchActiveStore, type ShopRow } from '@/lib/control-data';
import { getControlErrorMessage } from '@/lib/control-errors';
import { colors } from '@/lib/theme';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export function StoresSettingsModal({
  visible,
  compact,
  onClose,
  onSwitched,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
  onSwitched: () => Promise<void>;
}) {
  const [stores, setStores] = useState<ShopRow[]>([]);
  const [activeShopId, setActiveShopId] = useState('');
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadStores() {
    setLoading(true);
    try {
      const result = await listMyStores();
      setStores(result.stores);
      setActiveShopId(result.activeShopId);
    } catch (err) {
      setErrorMessage(getControlErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!visible) return;
    setErrorMessage('');
    setCreateVisible(false);
    setNewStoreName('');
    loadStores();
  }, [visible]);

  async function handleSwitch(shopId: string) {
    if (shopId === activeShopId || switchingId) return;
    setSwitchingId(shopId);
    setErrorMessage('');
    try {
      await switchActiveStore(shopId);
      await onSwitched();
      onClose();
    } catch (err) {
      setErrorMessage(getControlErrorMessage(err));
    } finally {
      setSwitchingId(null);
    }
  }

  async function handleCreate() {
    if (creating) return;
    if (newStoreName.trim().length < 2) {
      setErrorMessage('Donne un nom de boutique plus complet.');
      return;
    }
    setCreating(true);
    setErrorMessage('');
    try {
      const store = await createStore({ name: newStoreName.trim() });
      setStores((prev) => [...prev, store]);
      setNewStoreName('');
      setCreateVisible(false);
    } catch (err) {
      setErrorMessage(getControlErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.24)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 16,
            maxHeight: '85%',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: colors.gray900, fontSize: 22, fontWeight: '800' }}>Mes boutiques</Text>
              <Text style={{ color: colors.gray600, fontSize: 13 }}>Bascule entre tes boutiques</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.gray100,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color={colors.gray900} />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.dangerSoft }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.dangerDark }}>{errorMessage}</Text>
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'center', marginVertical: 8 }} />
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 8 }}>
                {stores.map((store) => {
                  const isActive = store.$id === activeShopId;
                  const isSwitching = switchingId === store.$id;

                  return (
                    <Pressable
                      key={store.$id}
                      onPress={() => handleSwitch(store.$id)}
                      disabled={isActive || switchingId !== null}
                      style={({ pressed }: { pressed: boolean }) => ({
                        borderRadius: 16,
                        backgroundColor: isActive ? colors.primarySoft : colors.gray50,
                        padding: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        opacity: pressed && !isActive ? 0.7 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: isActive ? colors.primary : colors.gray200,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Feather name="shopping-bag" size={16} color={isActive ? colors.white : colors.gray600} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ color: colors.gray900, fontSize: 15, fontWeight: '700' }}>
                          {store.name}
                        </Text>
                        <Text numberOfLines={1} style={{ color: colors.gray500, fontSize: 12, marginTop: 1 }}>
                          {isActive ? 'Boutique active' : 'Toucher pour basculer'}
                        </Text>
                      </View>
                      {isSwitching ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : isActive ? (
                        <Feather name="check-circle" size={20} color={colors.primary} />
                      ) : (
                        <Feather name="chevron-right" size={18} color={colors.gray400} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {createVisible ? (
            <View style={{ borderRadius: 16, backgroundColor: colors.gray50, padding: 14, gap: 10 }}>
              <Text style={{ color: colors.gray900, fontSize: 15, fontWeight: '800' }}>Nouvelle boutique</Text>
              <TextInput
                placeholder="Nom de la boutique"
                value={newStoreName}
                onChangeText={setNewStoreName}
                placeholderTextColor={colors.gray400}
                style={{ height: 44, borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 14, fontSize: 14, color: colors.gray900, fontWeight: '600' }}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => { setCreateVisible(false); setNewStoreName(''); }}
                  style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: colors.gray900, fontSize: 14, fontWeight: '700' }}>Annuler</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreate}
                  style={({ pressed }: { pressed: boolean }) => ({ flex: 2, height: 42, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed || creating ? 0.68 : 1 })}
                >
                  {creating
                    ? <ActivityIndicator size="small" color={colors.white} />
                    : <Text style={{ color: colors.white, fontSize: 14, fontWeight: '700' }}>Créer</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setCreateVisible(true)}
              style={({ pressed }: { pressed: boolean }) => ({
                height: 48, borderRadius: 16, backgroundColor: colors.primary, flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="plus" size={16} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 14, fontWeight: '700' }}>Nouvelle boutique</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
