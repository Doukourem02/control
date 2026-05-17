import { SellerActionTile, type SellerAction } from '@/components/seller-action-tile';
import { getTodaySummary, type TodaySummary } from '@/lib/control-data';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavKey = 'home' | 'report' | 'missing' | 'profile';

type NavIcon =
  | { family: 'asset'; name: 'home' | 'report' | 'missing' }
  | { family: 'material'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

const quickActions: SellerAction[] = [
  {
    title: 'Vente',
    subtitle: 'Nouvelle vente',
    icon: { family: 'feather', name: 'arrow-up-right' },
    accent: '#4C9BFF',
  },
  {
    title: 'Stock',
    subtitle: 'Articles',
    icon: { family: 'material', name: 'cube-outline' },
    accent: '#FF8A4C',
  },
  {
    title: 'Clôture',
    subtitle: 'Fin de journée',
    icon: { family: 'material', name: 'credit-card-outline' },
    accent: '#B94DFF',
  },
  {
    title: 'Sortie',
    subtitle: 'Dépense caisse',
    icon: { family: 'material', name: 'currency-usd' },
    accent: '#3B3B3B',
  },
];

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function NavAssetIcon({
  name,
  color,
  size,
}: {
  name: 'home' | 'report' | 'missing';
  color: string;
  size: number;
}) {
  const source =
    name === 'home'
      ? require('../assets/icons/home-flaticon-9664027.png')
      : name === 'report'
        ? require('../assets/icons/diagram-flaticon-9637699.png')
        : require('../assets/icons/wallet-flaticon-9122560.png');

  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        resizeMode: 'contain',
        tintColor: color,
      }}
    />
  );
}

function BottomNav({
  active = 'home',
  compact = false,
  onChange,
}: {
  active?: NavKey;
  compact?: boolean;
  onChange?: (key: NavKey) => void;
}) {
  const navHeight = compact ? 66 : 68;
  const itemSize = compact ? 50 : 52;
  const items: {
    key: NavKey;
    icon: NavIcon;
  }[] = [
    { key: 'home', icon: { family: 'asset', name: 'home' } },
    { key: 'report', icon: { family: 'asset', name: 'report' } },
    { key: 'missing', icon: { family: 'asset', name: 'missing' } },
    { key: 'profile', icon: { family: 'material', name: 'cog' } },
  ];

  return (
    <View
      style={{
        alignSelf: 'center',
        width: '66%',
        minWidth: 244,
        maxWidth: 292,
        height: navHeight,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 18px 34px rgba(0, 0, 0, 0.07)',
      }}
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange?.(item.key)}
            style={({ pressed }: { pressed: boolean }) => ({
              width: itemSize,
              height: itemSize,
              borderRadius: itemSize / 2,
              backgroundColor: isActive ? '#F7F7F7' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.64 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            {item.icon.family === 'asset' ? (
              <NavAssetIcon
                name={item.icon.name}
                size={compact ? 25 : 26}
                color={isActive ? '#050505' : '#A6A6A6'}
              />
            ) : (
              <MaterialCommunityIcons
                name={item.icon.name}
                size={compact ? 25 : 26}
                color={isActive ? '#050505' : '#A6A6A6'}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricCard({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact: boolean;
}) {
  return (
    <View
      style={{
        width: '48%',
        minHeight: compact ? 76 : 84,
        borderRadius: 24,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        padding: compact ? 16 : 18,
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: '#9B9B9B', fontSize: compact ? 13 : 14, fontWeight: '500' }}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
        style={{
          color: '#111111',
          fontSize: compact ? 20 : 22,
          lineHeight: compact ? 24 : 26,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: 58,
        borderRadius: 22,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        opacity: pressed ? 0.68 : 1,
      })}
    >
      <MaterialCommunityIcons name={icon} size={22} color="#777777" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text numberOfLines={1} style={{ color: '#A4A4A4', fontSize: 13, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color="#B0B0B0" />
    </Pressable>
  );
}

function HomeMenu({
  compact,
  onOpenReport,
  onOpenStock,
}: {
  compact: boolean;
  onOpenReport: () => void;
  onOpenStock: () => void;
}) {
  return (
    <>
      <View style={{ marginTop: compact ? 24 : 34, gap: compact ? 14 : 18 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>
          Actions rapides
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
              onPress={action.title === 'Stock' ? onOpenStock : undefined}
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={onOpenReport}
        style={({ pressed }: { pressed: boolean }) => ({
          alignSelf: 'center',
          minHeight: compact ? 34 : 38,
          marginTop: compact ? 24 : 34,
          marginBottom: compact ? 46 : 62,
          paddingHorizontal: 18,
          borderRadius: 21,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.62 : 1,
        })}
      >
        <Text style={{ color: '#2A8DEB', fontSize: compact ? 15 : 16, fontWeight: '600' }}>
          Ouvrir le bilan
        </Text>
        <Feather name="arrow-right" size={compact ? 19 : 20} color="#2A8DEB" />
      </Pressable>
    </>
  );
}

function ReportMenu({
  compact,
  amountsVisible,
  summary,
}: {
  compact: boolean;
  amountsVisible: boolean;
  summary: TodaySummary;
}) {
  const salesValue = amountsVisible
    ? formatMoney(summary.cashSalesAmount + summary.mobileMoneySalesAmount)
    : '•••';
  const expensesValue = amountsVisible ? formatMoney(summary.expensesAmount) : '•••';
  const cashGapValue = amountsVisible ? formatMoney(summary.latestCashGap) : '•••';

  return (
    <View style={{ marginTop: compact ? 24 : 34, marginBottom: compact ? 46 : 62, gap: 16 }}>
      <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Bilan</Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: compact ? 12 : 14,
        }}
      >
        <MetricCard label="Ventes" value={salesValue} compact={compact} />
        <MetricCard label="Sorties" value={expensesValue} compact={compact} />
        <MetricCard label="Écart caisse" value={cashGapValue} compact={compact} />
        <MetricCard label="Tickets" value={`${summary.salesCount}`} compact={compact} />
      </View>
    </View>
  );
}

function MissingMenu({ compact, amountsVisible }: { compact: boolean; amountsVisible: boolean }) {
  const moneyValue = amountsVisible ? '0 F' : '•••';

  return (
    <View style={{ marginTop: compact ? 24 : 34, marginBottom: compact ? 46 : 62, gap: 16 }}>
      <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Écarts</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
        <MetricCard label="Manquant" value={moneyValue} compact={compact} />
        <MetricCard label="Surplus" value={moneyValue} compact={compact} />
      </View>
      <SettingsRow icon="wallet" title="Caisse équilibrée" subtitle="Aucun mouvement à vérifier" />
      <SettingsRow icon="clipboard-text" title="Historique" subtitle="Sorties et corrections caisse" />
    </View>
  );
}

function ProfileMenu({ compact }: { compact: boolean }) {
  return (
    <View style={{ marginTop: compact ? 24 : 34, marginBottom: compact ? 46 : 62, gap: 13 }}>
      <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Réglages</Text>
      <SettingsRow icon="store" title="Boutique" subtitle="Informations et horaires" />
      <SettingsRow icon="account-group" title="Équipe" subtitle="Vendeurs et permissions" />
      <SettingsRow icon="tune" title="Préférences" subtitle="Caisse, alertes et affichage" />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<NavKey>('home');
  const [amountsVisible, setAmountsVisible] = useState(true);
  const [todaySummary, setTodaySummary] = useState<TodaySummary>({
    cashSalesAmount: 0,
    mobileMoneySalesAmount: 0,
    expensesAmount: 0,
    physicalCashExpected: 0,
    salesCount: 0,
    expensesCount: 0,
    latestCashGap: 0,
  });
  const { width, height } = useWindowDimensions();
  const compact = height < 900;
  const contentWidth = Math.min(width, 520);
  const alertText =
    todaySummary.salesCount === 0
      ? 'Aucune vente aujourd’hui'
      : `${todaySummary.salesCount} vente${todaySummary.salesCount > 1 ? 's' : ''} aujourd’hui`;
  const expectedCashAmount = todaySummary.physicalCashExpected;
  const displayedCashAmount = amountsVisible ? formatMoney(expectedCashAmount) : '•••';
  const cashTrendText = amountsVisible ? 'à encaisser' : 'masqué';
  const dailySummary = amountsVisible
    ? `${todaySummary.salesCount} vente${todaySummary.salesCount > 1 ? 's' : ''} · ${
        todaySummary.expensesCount
      } sortie${todaySummary.expensesCount > 1 ? 's' : ''} · ${
        todaySummary.latestCashGap === 0 ? 'aucun écart' : `${formatMoney(todaySummary.latestCashGap)} écart`
      }`
    : 'Détails de caisse masqués';

  useEffect(() => {
    let isMounted = true;

    getTodaySummary().then((summary) => {
      if (isMounted) {
        setTodaySummary(summary);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
                <Image
                  source={require('../assets/icons/user-flaticon-1077114.png')}
                  style={{
                    width: 25,
                    height: 25,
                    resizeMode: 'contain',
                    tintColor: '#777777',
                  }}
                />
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
                <MaterialCommunityIcons name="bell" size={25} color="#777777" />
              </Pressable>
            </View>

            <View style={{ marginTop: compact ? 20 : 28, gap: compact ? 8 : 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8D8D8D', fontSize: 16, fontWeight: '600' }}>
                  Caisse du jour
                </Text>
                <Pressable
                  onPress={() => setAmountsVisible((visible) => !visible)}
                  style={({ pressed }: { pressed: boolean }) => ({
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.62 : 1,
                  })}
                >
                  <Feather name={amountsVisible ? 'eye' : 'eye-off'} size={18} color="#A7A7A7" />
                </Pressable>
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
                  {displayedCashAmount}
                </Text>
                <Text
                  style={{
                    color: expectedCashAmount >= 0 ? '#34C875' : '#E5484D',
                    fontSize: 15,
                    lineHeight: 29,
                    fontWeight: '700',
                  }}
                >
                  {amountsVisible ? (expectedCashAmount >= 0 ? '↗' : '↘') : '•'} {cashTrendText}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setActiveMenu('report')}
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
                <Feather name="arrow-down-left" size={22} color="#32C171" />
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
                  {dailySummary}
                </Text>
              </View>
              <Feather name="arrow-right" size={22} color="#111111" />
            </Pressable>

            {activeMenu === 'home' ? (
              <HomeMenu
                compact={compact}
                onOpenReport={() => setActiveMenu('report')}
                onOpenStock={() => router.push('/stock' as never)}
              />
            ) : activeMenu === 'report' ? (
              <ReportMenu
                compact={compact}
                amountsVisible={amountsVisible}
                summary={todaySummary}
              />
            ) : activeMenu === 'missing' ? (
              <MissingMenu compact={compact} amountsVisible={amountsVisible} />
            ) : (
              <ProfileMenu compact={compact} />
            )}
          </View>

          <BottomNav active={activeMenu} compact={compact} onChange={setActiveMenu} />
        </View>
      </View>
    </SafeAreaView>
  );
}
