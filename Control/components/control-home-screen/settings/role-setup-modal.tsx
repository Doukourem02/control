import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

export function RoleSetupModal({
  visible,
  compact,
  loading,
  errorMessage,
  onSelectOwner,
  onSelectSeller,
}: {
  visible: boolean;
  compact: boolean;
  loading: boolean;
  errorMessage: string;
  onSelectOwner: () => void;
  onSelectSeller: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => null}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: compact ? 28 : 44,
            paddingBottom: compact ? 24 : 34,
            justifyContent: 'center',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: compact ? 28 : 36 }}>
            <View
              style={{
                width: 86,
                height: 86,
                borderRadius: 16,
                backgroundColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 26,
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Image
                source={require('../../../assets/images/app-icon.png')}
                style={{ width: 86, height: 86, borderRadius: 16, resizeMode: 'cover' }}
              />
            </View>
            <Text style={{ color: colors.gray900, fontSize: compact ? 29 : 32, fontWeight: '800', textAlign: 'center' }}>
              Définir mon rôle
            </Text>
            <Text
              style={{
                color: colors.gray600,
                fontSize: 16,
                lineHeight: 23,
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 10,
                maxWidth: 320,
              }}
            >
              Choisis comment tu vas utiliser CONTROL pour afficher les bonnes étapes.
            </Text>
          </View>

          {errorMessage ? (
            <View style={{ borderRadius: 16, backgroundColor: colors.warningSoft, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 }}>
              <Text style={{ color: colors.warningDark, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={{ gap: 14 }}>
            <Pressable
              disabled={loading}
              onPress={onSelectOwner}
              style={({ pressed }: { pressed: boolean }) => ({
                borderRadius: 16,
                borderCurve: 'continuous',
                borderWidth: 1.5,
                borderColor: colors.gray900,
                backgroundColor: colors.white,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                opacity: pressed || loading ? 0.72 : 1,
              })}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  backgroundColor: colors.gray100,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="storefront-outline" size={28} color={colors.gray900} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: colors.gray900, fontSize: 18, fontWeight: '800' }}>Manager</Text>
                <Text style={{ color: colors.gray600, fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 3 }}>
                  Je crée et je gère ma boutique
                </Text>
              </View>
              <Feather name="chevron-right" size={22} color={colors.gray900} />
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={onSelectSeller}
              style={({ pressed }: { pressed: boolean }) => ({
                borderRadius: 16,
                borderCurve: 'continuous',
                borderWidth: 1.5,
                borderColor: colors.gray200,
                backgroundColor: colors.gray50,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                opacity: pressed || loading ? 0.72 : 1,
              })}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="account-tie-outline" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: colors.gray900, fontSize: 18, fontWeight: '800' }}>Vendeur</Text>
                <Text style={{ color: colors.gray600, fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 3 }}>
                  Je rejoins la boutique d’un manager
                </Text>
              </View>
              <Feather name="chevron-right" size={22} color={colors.gray900} />
            </Pressable>
          </View>

          {loading ? <ActivityIndicator color={colors.gray900} style={{ marginTop: 22 }} /> : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
