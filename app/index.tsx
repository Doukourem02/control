import { SellerActionTile, type SellerAction } from '@/components/seller-action-tile';
import { useStockStore } from '@/components/stock-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

type AppRoute =
  | '/'
  | '/sell'
  | '/stock'
  | '/expense'
  | '/cash'
  | '/missing-stock'
  | '/report'
  | '/profile';

const quickActions: SellerAction[] = [
  {
    title: 'Vendre',
    subtitle: 'Nouvelle vente',
    icon: 'arrow-top-right',
    accent: '#4C9BFF',
    route: '/sell',
  },
  {
    title: 'Stock',
    subtitle: 'Produits',
    icon: 'package-variant-closed',
    accent: '#FF8A4C',
    route: '/stock',
  },
  {
    title: 'Caisse',
    subtitle: 'Fermer journée',
    icon: 'wallet-outline',
    accent: '#B94DFF',
    route: '/cash',
  },
  {
    title: 'Dépense',
    subtitle: 'Sortie argent',
    icon: 'receipt-text-outline',
    accent: '#333333',
    route: '/expense',
  },
];

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function BottomNav({ active = 'home' }: { active?: 'home' | 'report' | 'missing' | 'profile' }) {
  const router = useRouter();
  const items: {
    key: 'home' | 'report' | 'missing' | 'profile';
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    route: AppRoute;
  }[] = [
    { key: 'home', icon: 'home-variant', route: '/' },
    { key: 'report', icon: 'chart-pie', route: '/report' },
    { key: 'missing', icon: 'package-variant-closed-remove', route: '/missing-stock' },
    { key: 'profile', icon: 'cog', route: '/profile' },
  ];

  return (
    <View
      style={{
        alignSelf: 'center',
        width: '78%',
        minWidth: 286,
        maxWidth: 360,
        height: 78,
        borderRadius: 39,
        backgroundColor: '#FFFFFF',
        padding: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 18px 38px rgba(0, 0, 0, 0.08)',
      }}
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Pressable
            key={item.key}
            onPress={() => router.push(item.route)}
            style={({ pressed }: { pressed: boolean }) => ({
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: isActive ? '#F7F7F7' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.64 : 1,
            })}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={27}
              color={isActive ? '#050505' : '#A7A7A7'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    sales,
    expenses,
    missingStocks,
    todaySalesAmount,
    todayExpensesAmount,
    expectedCashAmount,
    totalStockKg,
  } = useStockStore();
  const contentWidth = Math.min(width, 520);
  const lastSale = sales[0];
  const alertText = lastSale
    ? `${lastSale.productName} vendu pour ${formatMoney(lastSale.totalAmount)}`
    : 'Aucune vente enregistrée pour aujourd’hui';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={{
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingTop: 34,
        paddingBottom: 30,
      }}
    >
      <View style={{ width: contentWidth, gap: 26 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }: { pressed: boolean }) => ({
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.62 : 1,
            })}
          >
            <MaterialCommunityIcons name="account" size={27} color="#7E7E7E" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/report')}
            style={({ pressed }: { pressed: boolean }) => ({
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.62 : 1,
            })}
          >
            <MaterialCommunityIcons name="bell" size={25} color="#7E7E7E" />
          </Pressable>
        </View>

        <View style={{ gap: 15 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#8E8E8E', fontSize: 18, fontWeight: '700' }}>
              Argent attendu
            </Text>
            <MaterialCommunityIcons name="eye" size={18} color="#A5A5A5" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
            <Text
              selectable
              style={{
                color: '#0A0A0A',
                fontSize: 43,
                lineHeight: 48,
                fontWeight: '900',
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatMoney(expectedCashAmount)}
            </Text>
            <Text
              style={{
                color: expectedCashAmount >= 0 ? '#34C875' : '#E5484D',
                fontSize: 16,
                lineHeight: 30,
                fontWeight: '800',
              }}
            >
              {expectedCashAmount >= 0 ? '↗' : '↘'} caisse
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/report')}
          style={({ pressed }: { pressed: boolean }) => ({
            minHeight: 84,
            borderRadius: 24,
            borderCurve: 'continuous',
            backgroundColor: '#FFFFFF',
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: pressed ? 0.7 : 1,
            boxShadow: '0 10px 26px rgba(0, 0, 0, 0.04)',
          })}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: '#F4F9F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="arrow-bottom-left" size={25} color="#32C171" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ color: '#111111', fontSize: 17, fontWeight: '700' }}
            >
              {alertText}
            </Text>
            <Text numberOfLines={1} style={{ color: '#B0B0B0', fontSize: 14, fontWeight: '600' }}>
              {sales.length} ventes · {expenses.length} dépenses · {missingStocks.length} manquants
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={25} color="#111111" />
        </Pressable>

        <View style={{ gap: 15 }}>
          <Text style={{ color: '#111111', fontSize: 22, fontWeight: '900' }}>Quick Actions</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {quickActions.map((action) => (
              <SellerActionTile
                key={action.title}
                action={action}
                onPress={() => router.push(action.route as AppRoute)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 20, alignItems: 'center', paddingTop: 8 }}>
          <Pressable
            onPress={() => router.push('/report')}
            style={({ pressed }: { pressed: boolean }) => ({
              minHeight: 42,
              paddingHorizontal: 18,
              borderRadius: 21,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.62 : 1,
            })}
          >
            <Text style={{ color: '#2A8DEB', fontSize: 18, fontWeight: '800' }}>
              Voir le bilan du jour
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#2A8DEB" />
          </Pressable>

          <View
            style={{
              width: '100%',
              borderRadius: 26,
              borderCurve: 'continuous',
              backgroundColor: '#FAFAFA',
              borderWidth: 1,
              borderColor: '#F1F1F1',
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 17,
                borderCurve: 'continuous',
                backgroundColor: '#EAF6FF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="scale-balance" size={27} color="#2A8DEB" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: '#111111', fontSize: 19, fontWeight: '800' }}>
                Résumé rapide
              </Text>
              <Text numberOfLines={1} style={{ color: '#A1A1A1', fontSize: 15, fontWeight: '600' }}>
                {formatMoney(todaySalesAmount)} ventes · {formatMoney(todayExpensesAmount)} sorties ·{' '}
                {totalStockKg.toLocaleString('fr-FR')} kg
              </Text>
            </View>
          </View>
        </View>

        <BottomNav />
      </View>
    </ScrollView>
  );
}
