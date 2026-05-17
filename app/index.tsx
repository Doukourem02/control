import { SellerActionTile, type SellerAction } from '@/components/seller-action-tile';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const quickActions: SellerAction[] = [
  {
    title: 'Vendre',
    subtitle: 'Nouvelle vente',
    icon: 'arrow-up-right',
    accent: '#4C9BFF',
  },
  {
    title: 'Stock',
    subtitle: 'Produits',
    icon: 'box',
    accent: '#FF8A4C',
  },
  {
    title: 'Caisse',
    subtitle: 'Fermer journée',
    icon: 'credit-card',
    accent: '#B94DFF',
  },
  {
    title: 'Dépense',
    subtitle: 'Sortie argent',
    icon: 'file-text',
    accent: '#3B3B3B',
  },
];

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function BottomNav({
  active = 'home',
  compact = false,
}: {
  active?: 'home' | 'report' | 'missing' | 'profile';
  compact?: boolean;
}) {
  const navHeight = compact ? 68 : 72;
  const itemSize = compact ? 50 : 54;
  const items: {
    key: 'home' | 'report' | 'missing' | 'profile';
    icon: keyof typeof Feather.glyphMap;
  }[] = [
    { key: 'home', icon: 'home' },
    { key: 'report', icon: 'pie-chart' },
    { key: 'missing', icon: 'box' },
    { key: 'profile', icon: 'settings' },
  ];

  return (
    <View
      style={{
        alignSelf: 'center',
        width: '85%',
        minWidth: 292,
        maxWidth: 372,
        height: navHeight,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        padding: compact ? 8 : 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 16px 34px rgba(0, 0, 0, 0.07)',
      }}
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Pressable
            key={item.key}
            style={({ pressed }: { pressed: boolean }) => ({
              width: itemSize,
              height: itemSize,
              borderRadius: itemSize / 2,
              backgroundColor: isActive ? '#F7F7F7' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.64 : 1,
            })}
          >
            <Feather
              name={item.icon}
              size={22}
              color={isActive ? '#050505' : '#A6A6A6'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const compact = height < 820;
  const contentWidth = Math.min(width, 520);
  const alertText = 'Aucune vente enregistrée';
  const expectedCashAmount = 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <View
          style={{
            width: contentWidth,
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: compact ? 8 : 14,
            paddingBottom: compact ? 12 : 18,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                height: 38,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Pressable
                style={({ pressed }: { pressed: boolean }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.62 : 1,
                })}
              >
                <Feather name="user" size={21} color="#777777" />
              </Pressable>

              <Pressable
                style={({ pressed }: { pressed: boolean }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.62 : 1,
                })}
              >
                <Feather name="bell" size={20} color="#777777" />
              </Pressable>
            </View>

            <View style={{ marginTop: compact ? 20 : 28, gap: compact ? 8 : 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8D8D8D', fontSize: 16, fontWeight: '600' }}>
                  Argent attendu
                </Text>
                <Feather name="eye" size={17} color="#A7A7A7" />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
                <Text
                  selectable
                  style={{
                    color: '#050505',
                    fontSize: compact ? 43 : 46,
                    lineHeight: compact ? 48 : 52,
                    fontWeight: '700',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatMoney(expectedCashAmount)}
                </Text>
                <Text
                  style={{
                    color: expectedCashAmount >= 0 ? '#34C875' : '#E5484D',
                    fontSize: 15,
                    lineHeight: 29,
                    fontWeight: '700',
                  }}
                >
                  {expectedCashAmount >= 0 ? '↗' : '↘'} caisse
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }: { pressed: boolean }) => ({
                height: compact ? 62 : 66,
                marginTop: compact ? 22 : 30,
                borderRadius: 26,
                borderCurve: 'continuous',
                backgroundColor: '#FFFFFF',
                paddingHorizontal: compact ? 13 : 15,
                flexDirection: 'row',
                alignItems: 'center',
                gap: compact ? 12 : 14,
                opacity: pressed ? 0.72 : 1,
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.035)',
              })}
            >
              <View
                style={{
                  width: compact ? 42 : 46,
                  height: compact ? 42 : 46,
                  borderRadius: compact ? 21 : 23,
                  backgroundColor: '#F1FAF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="arrow-down-left" size={21} color="#32C171" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: '#111111',
                    fontSize: compact ? 15 : 16,
                    fontWeight: '600',
                  }}
                >
                  {alertText}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: '#A8A8A8', fontSize: compact ? 13 : 14, fontWeight: '400' }}
                >
                  0 ventes · 0 dépenses · 0 manquants
                </Text>
              </View>
              <Feather name="chevron-right" size={22} color="#111111" />
            </Pressable>

            <View style={{ marginTop: compact ? 24 : 34, gap: compact ? 14 : 18 }}>
              <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>
                Quick Actions
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  rowGap: compact ? 14 : 18,
                }}
              >
                {quickActions.map((action) => (
                  <SellerActionTile
                    key={action.title}
                    action={action}
                    compact={compact}
                  />
                ))}
              </View>
            </View>

            <Pressable
              style={({ pressed }: { pressed: boolean }) => ({
                alignSelf: 'center',
                minHeight: compact ? 34 : 38,
                marginTop: compact ? 26 : 36,
                marginBottom: compact ? 30 : 40,
                paddingHorizontal: 18,
                borderRadius: 21,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <Text style={{ color: '#2A8DEB', fontSize: compact ? 16 : 17, fontWeight: '600' }}>
                Voir le bilan du jour
              </Text>
              <Feather name="arrow-right" size={19} color="#2A8DEB" />
            </Pressable>
          </View>

          <BottomNav compact={compact} />
        </View>
      </View>
    </SafeAreaView>
  );
}
