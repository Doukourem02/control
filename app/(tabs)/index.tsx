import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type MenuItem = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  background: string;
  iconBackground: string;
  iconColor: string;
  wide?: boolean;
  dark?: boolean;
};

const menuItems: MenuItem[] = [
  {
    title: 'Vendre',
    subtitle: 'Client paye',
    icon: 'cart',
    href: '/sale',
    background: '#111111',
    iconBackground: '#FFFFFF',
    iconColor: '#111111',
    dark: true,
  },
  {
    title: 'Stock',
    subtitle: 'Ajouter ou sortir',
    icon: 'cube',
    href: '/stock',
    background: '#F3F8F5',
    iconBackground: '#DDF3E8',
    iconColor: '#0B8F5A',
  },
  {
    title: 'Depense',
    subtitle: 'Argent sorti',
    icon: 'receipt',
    href: '/expenses',
    background: '#FFF6E4',
    iconBackground: '#FFE6A8',
    iconColor: '#A85D00',
  },
  {
    title: 'Caisse',
    subtitle: 'Compter argent',
    icon: 'cash',
    href: '/cash',
    background: '#F4F0FA',
    iconBackground: '#E4D8F4',
    iconColor: '#6F42C1',
    wide: true,
  },
  {
    title: 'Alerte',
    subtitle: 'Probleme',
    icon: 'warning',
    href: '/alerts',
    background: '#FFEDEC',
    iconBackground: '#FFD5D2',
    iconColor: '#D94841',
  },
  {
    title: 'Journee',
    subtitle: 'Voir ce jour',
    icon: 'calendar',
    href: '/reports',
    background: '#EDF5FF',
    iconBackground: '#D6E9FF',
    iconColor: '#1B66D2',
  },
  {
    title: 'Boutique',
    subtitle: 'Mon lieu',
    icon: 'storefront',
    href: '/stores',
    background: '#F5F5F5',
    iconBackground: '#E7E7E7',
    iconColor: '#111111',
  },
  {
    title: 'Plus',
    subtitle: 'Autres',
    icon: 'grid',
    href: '/more',
    background: '#F5F5F5',
    iconBackground: '#E7E7E7',
    iconColor: '#111111',
  },
];

const dailyActivityCards = [
  {
    title: 'Ventes',
    value: '31',
    note: 'tickets',
    icon: 'cart-outline',
    background: '#F3F8F5',
    iconColor: '#0B8F5A',
  },
  {
    title: 'Depenses',
    value: '42k',
    note: 'FCFA sortis',
    icon: 'receipt-outline',
    background: '#FFF6E4',
    iconColor: '#A85D00',
  },
  {
    title: 'Stock',
    value: '3',
    note: 'produits faibles',
    icon: 'cube-outline',
    background: '#FFEDEC',
    iconColor: '#D94841',
  },
] satisfies {
  title: string;
  value: string;
  note: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  iconColor: string;
}[];

const banners = [
  {
    eyebrow: "Aujourd'hui",
    title: '31 ventes enregistrees',
    subtitle: 'Stock et caisse mis a jour automatiquement.',
    detail: 'Caisse: 212 000 FCFA',
    icon: 'cash-outline',
    background: '#C5B2DC',
    foreground: '#FFFFFF',
  },
  {
    eyebrow: 'Stock',
    title: '3 kg de crevettes restants',
    subtitle: 'Produit critique a surveiller avant rupture.',
    detail: 'Voir inventaire',
    icon: 'cube-outline',
    background: '#E8F6EF',
    foreground: '#111111',
  },
  {
    eyebrow: 'Controle',
    title: '1 alerte caisse ouverte',
    subtitle: 'Ecart detecte sur la cloture de Cocody.',
    detail: 'Verifier alerte',
    icon: 'warning-outline',
    background: '#111111',
    foreground: '#FFFFFF',
  },
] as const;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const bannerWidth = width - (isCompact ? 32 : 44);
  const bannerRef = useRef<{ scrollTo: (options: { x: number; animated?: boolean }) => void } | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((current) => {
        const next = (current + 1) % banners.length;

        bannerRef.current?.scrollTo({
          x: next * bannerWidth,
          animated: true,
        });

        return next;
      });
    }, 3600);

    return () => clearInterval(timer);
  }, [bannerWidth]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, isCompact && styles.compactContent]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>MD</Text>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.identityCopy}>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text numberOfLines={1} style={styles.userName}>
              Mohamed DOUKOURE
            </Text>
            <Text numberOfLines={1} style={styles.userMeta}>
              Poissonnerie Cocody - Vendeur
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Link href="/alerts" asChild>
            <Pressable style={styles.roundButton}>
              <Ionicons name="notifications-outline" size={24} color="#111111" />
              <View style={styles.notificationDot} />
            </Pressable>
          </Link>

          <Link href="/more" asChild>
            <Pressable style={styles.roundButton}>
              <Ionicons name="ellipsis-horizontal" size={26} color="#111111" />
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchText}>Rechercher produit, vente...</Text>
          <Ionicons name="search" size={23} color="#B9B9B9" />
        </View>

        <Pressable style={styles.filterButton}>
          <Ionicons name="filter" size={29} color="#111111" />
        </Pressable>
      </View>

      <View style={styles.carousel}>
        <ScrollView
          ref={bannerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            const next = Math.max(0, Math.min(banners.length - 1, Math.round(event.nativeEvent.contentOffset.x / bannerWidth)));
            setActiveBanner(next);
          }}>
          {banners.map((banner) => (
            <View key={banner.title} style={[styles.hero, { width: bannerWidth, backgroundColor: banner.background }]}>
              <View style={styles.heroCopy}>
                <Text style={[styles.heroEyebrow, { color: banner.foreground }]}>{banner.eyebrow}</Text>
                <Text style={[styles.heroTitle, { color: banner.foreground }]}>{banner.title}</Text>
                <Text style={[styles.heroSubtitle, { color: banner.foreground }]}>{banner.subtitle}</Text>
                <View style={[styles.heroBadge, banner.foreground === '#FFFFFF' && styles.heroBadgeDark]}>
                  <Text style={[styles.heroBadgeText, banner.foreground === '#FFFFFF' && styles.heroBadgeTextDark]}>
                    {banner.detail}
                  </Text>
                </View>
              </View>

              <View style={[styles.heroIllustration, banner.foreground === '#FFFFFF' && styles.heroIllustrationDark]}>
                <Ionicons name={banner.icon} size={54} color={banner.foreground} />
                <View style={styles.heroSpark}>
                  <Ionicons name="trending-up" size={18} color="#111111" />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.carouselDots}>
          {banners.map((banner, index) => (
            <View
              key={banner.title}
              style={[styles.dot, activeBanner === index && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item) => (
          <ServiceCard key={item.title} item={item} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Activite du jour</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activityList}>
        {dailyActivityCards.map((card) => (
          <View key={card.title} style={[styles.activityCard, { backgroundColor: card.background }]}>
            <View style={styles.activityIcon}>
              <Ionicons name={card.icon} size={30} color={card.iconColor} />
            </View>
            <Text style={styles.activityTitle}>{card.title}</Text>
            <Text style={styles.activityValue}>{card.value}</Text>
            <Text style={styles.activityNote}>{card.note}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.syncFooter}>
        <View style={styles.syncIcon}>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.syncCopy}>
          <Text style={styles.syncTitle}>Synchronise il y a 2 min</Text>
          <Text style={styles.syncMeta}>Mode hors ligne pret</Text>
        </View>
        <Ionicons name="cloud-done-outline" size={24} color="#0B8F5A" />
      </View>
    </ScrollView>
  );
}

function ServiceCard({ item }: { item: MenuItem }) {
  return (
    <Link href={item.href} asChild>
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [
          styles.card,
          { backgroundColor: item.background },
          item.wide && styles.wideCard,
          pressed && styles.pressedCard,
        ]}>
        <View style={[styles.iconBubble, { backgroundColor: item.iconBackground }, item.wide && styles.wideIconBubble]}>
          <Ionicons name={item.icon} size={item.wide ? 50 : 36} color={item.iconColor} />
        </View>

        <View style={styles.cardCopy}>
          <Text style={[styles.cardTitle, item.dark && styles.darkText]}>{item.title}</Text>
          <Text style={[styles.cardSubtitle, item.dark && styles.darkMutedText]}>{item.subtitle}</Text>
        </View>

        {item.dark ? (
          <Ionicons name="arrow-forward" size={38} color="#FFFFFF" style={styles.darkArrow} />
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingTop: 58,
    paddingHorizontal: 22,
    paddingBottom: 34,
    gap: 24,
  },
  compactContent: {
    paddingHorizontal: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#F1F1F1',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#35C987',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  greeting: {
    color: '#8D8888',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
  },
  userName: {
    color: '#2B1A18',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
  },
  userMeta: {
    color: '#8B8585',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  roundButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E2E2E2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  notificationDot: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D94841',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    height: 64,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E6E7EB',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBFBFC',
  },
  searchText: {
    color: '#8F8F8F',
    fontSize: 18,
    fontWeight: '700',
  },
  filterButton: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayStrip: {
    minHeight: 62,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: -8,
  },
  todayLabel: {
    color: '#8A8A8A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  todayValue: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  cashShortcut: {
    minWidth: 98,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
  },
  cashShortcutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  carousel: {
    overflow: 'hidden',
    gap: 12,
  },
  hero: {
    minHeight: 178,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  heroEyebrow: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    opacity: 0.72,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: '#F6F0FF',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    opacity: 0.82,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(17, 17, 17, 0.08)',
    paddingHorizontal: 13,
    justifyContent: 'center',
    marginTop: 8,
  },
  heroBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroBadgeText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
  },
  heroBadgeTextDark: {
    color: '#FFFFFF',
  },
  carouselDots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DDDDDD',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#111111',
  },
  heroIllustration: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: 'rgba(17, 17, 17, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIllustrationDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  heroSpark: {
    position: 'absolute',
    right: -3,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMock: {
    width: 80,
    height: 112,
    borderRadius: 24,
    backgroundColor: '#F8F8F8',
    borderWidth: 5,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    transform: [{ rotate: '-7deg' }],
  },
  phoneLineWide: {
    width: 44,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#111111',
  },
  phoneLine: {
    width: 34,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#DCCBEE',
  },
  phoneLineShort: {
    width: 22,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#35C987',
  },
  coinOne: {
    position: 'absolute',
    right: 5,
    top: 7,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE28A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinTwo: {
    position: 'absolute',
    left: 5,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontWeight: '900',
    color: '#171717',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '30.9%',
    minWidth: 96,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 13,
    justifyContent: 'space-between',
  },
  wideCard: {
    width: '64.2%',
    aspectRatio: 2.12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  darkCard: {
    backgroundColor: '#111111',
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  iconBubble: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideIconBubble: {
    width: 86,
    height: 86,
    borderRadius: 24,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  cardTitle: {
    color: '#222222',
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
  },
  cardSubtitle: {
    color: '#7B7B7B',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkMutedText: {
    color: '#FFFFFF',
  },
  darkArrow: {
    position: 'absolute',
    right: 12,
    bottom: 11,
  },
  sectionHeader: {
    marginTop: 2,
  },
  sectionTitle: {
    color: '#171717',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
  },
  activityList: {
    gap: 12,
    paddingRight: 22,
  },
  activityCard: {
    width: 150,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
    minHeight: 156,
    justifyContent: 'space-between',
  },
  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '900',
  },
  activityValue: {
    color: '#111111',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  activityNote: {
    color: '#7A7A7A',
    fontSize: 12,
    fontWeight: '700',
  },
  syncFooter: {
    minHeight: 72,
    borderRadius: 20,
    backgroundColor: '#F4F7F5',
    borderWidth: 1,
    borderColor: '#E2EEE7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0B8F5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  syncTitle: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  syncMeta: {
    color: '#6C7770',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
