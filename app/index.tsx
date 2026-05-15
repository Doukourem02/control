import { SellerActionTile, type SellerAction } from '@/components/seller-action-tile';
import { useStockStore } from '@/components/stock-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

type HeroCard = {
  title: string;
  subtitle: string;
  metric: string;
  tag: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  background: string;
  accent: string;
  foreground: string;
};

type AppRoute = '/sell' | '/stock' | '/expense' | '/cash' | '/missing-stock' | '/report';

const sellerActions: SellerAction[] = [
  {
    title: 'Vendre',
    subtitle: 'Nouvelle vente',
    icon: 'cash-register',
    accent: '#20A36A',
    tone: 'primary',
    route: '/sell',
  },
  {
    title: 'Stock',
    subtitle: 'Voir produits',
    icon: 'package-variant-closed',
    accent: '#2563EB',
    route: '/stock',
  },
  {
    title: 'Dépense',
    subtitle: 'Sortie argent',
    icon: 'receipt-text-outline',
    accent: '#E85D2A',
    route: '/expense',
  },
  {
    title: 'Caisse',
    subtitle: 'Fermer journée',
    icon: 'wallet-outline',
    accent: '#7C3AED',
    route: '/cash',
  },
  {
    title: 'Manquant',
    subtitle: 'Stock perdu',
    icon: 'package-variant-closed-remove',
    accent: '#DC2626',
    route: '/missing-stock',
  },
  {
    title: 'Bilan',
    subtitle: 'Voir mes ventes, dépenses et caisse',
    icon: 'clipboard-text-clock-outline',
    accent: '#0F766E',
    tone: 'summary',
    route: '/report',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { totalStockKg, stockPurchaseValue, todaySalesAmount } = useStockStore();
  const { width, height } = useWindowDimensions();
  const carouselRef = useRef<ScrollView | null>(null);
  const activeIndexRef = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isCompactHome = height <= 1100 || width <= 1000;
  const horizontalPadding = isCompactHome ? 16 : 20;
  const heroWidth = Math.min(width - horizontalPadding * 2, 430);
  const snapInterval = heroWidth + 12;
  const heroCards: HeroCard[] = [
    {
      title: 'CONTROL',
      subtitle: 'Les ventes sortent uniquement du stock renseigné.',
      metric: `${Math.round(todaySalesAmount).toLocaleString('fr-FR')} F`,
      tag: 'Ventes du jour',
      icon: 'chart-box-outline',
      background: '#E9D8FD',
      accent: '#7C3AED',
      foreground: '#251137',
    },
    {
      title: 'Stock précis',
      subtitle: 'Ajoutez poissons, poulets, viandes, kilos et prix.',
      metric: `${totalStockKg.toLocaleString('fr-FR')} kg`,
      tag: 'Stock restant',
      icon: 'package-variant-closed-check',
      background: '#D8F3EA',
      accent: '#0F766E',
      foreground: '#0B352F',
    },
    {
      title: 'Achats suivis',
      subtitle: 'Gardez le montant investi dans le stock sous les yeux.',
      metric: `${Math.round(stockPurchaseValue).toLocaleString('fr-FR')} F`,
      tag: 'Achat stock',
      icon: 'wallet-bifold-outline',
      background: '#FFE3C2',
      accent: '#E85D2A',
      foreground: '#3A1B0E',
    },
  ];

  useEffect(() => {
    const carouselTimer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % heroCards.length;

      activeIndexRef.current = nextIndex;
      carouselRef.current?.scrollTo?.({
        x: nextIndex * snapInterval,
        y: 0,
        animated: true,
      });
    }, 4200);

    return () => clearInterval(carouselTimer);
  }, [heroCards.length, snapInterval]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={{
        paddingHorizontal: horizontalPadding,
        paddingTop: isCompactHome ? 4 : 18,
        paddingBottom: isCompactHome ? 12 : 36,
        gap: isCompactHome ? 20 : 16,
      }}
    >
      <View style={{ gap: isCompactHome ? 10 : 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }: { pressed: boolean }) => ({
              width: isCompactHome ? 38 : 48,
              height: isCompactHome ? 38 : 48,
              borderRadius: isCompactHome ? 19 : 24,
              backgroundColor: '#111111',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.72 : 1,
              boxShadow: '0 8px 16px rgba(17, 17, 17, 0.12)',
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: isCompactHome ? 14 : 17, fontWeight: '900' }}>
              MD
            </Text>
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#8A8580', fontSize: isCompactHome ? 13 : 15, fontWeight: '600' }}>
              Hey
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={{ color: '#211716', fontSize: isCompactHome ? 17 : 19, fontWeight: '900' }}
            >
              Mohamed DOUKOURE
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/customize')}
            style={({ pressed }: { pressed: boolean }) => ({
              width: isCompactHome ? 38 : 48,
              height: isCompactHome ? 38 : 48,
              borderRadius: isCompactHome ? 19 : 24,
              borderWidth: 1.5,
              borderColor: '#D8D4CF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.68 : 1,
            })}
          >
            <Ionicons name="add" size={isCompactHome ? 24 : 28} color="#111111" />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              minHeight: isCompactHome ? 38 : 52,
              borderRadius: isCompactHome ? 16 : 21,
              borderWidth: 1.5,
              borderColor: '#E4E1DD',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <Ionicons name="search" size={isCompactHome ? 18 : 21} color="#8F8A85" />
            <TextInput
              placeholder="Rechercher..."
              placeholderTextColor="#8F8A85"
              style={{
                flex: 1,
                color: '#171717',
                fontSize: isCompactHome ? 15 : 17,
                fontWeight: '600',
                paddingVertical: 0,
              }}
            />
          </View>

          <Pressable
            style={({ pressed }: { pressed: boolean }) => ({
              width: isCompactHome ? 38 : 52,
              height: isCompactHome ? 38 : 52,
              borderRadius: isCompactHome ? 16 : 20,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.68 : 1,
              boxShadow: '0 8px 16px rgba(20, 20, 20, 0.06)',
            })}
          >
            <Ionicons name="filter" size={isCompactHome ? 21 : 25} color="#111111" />
          </Pressable>
        </View>
      </View>

      <View style={{ gap: isCompactHome ? 8 : 10 }}>
        <Animated.ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);

            activeIndexRef.current = nextIndex;
          }}
        >
          {heroCards.map((card, index) => {
            const inputRange = [
              (index - 1) * snapInterval,
              index * snapInterval,
              (index + 1) * snapInterval,
            ];
            const cardScale = scrollX.interpolate({
              inputRange,
              outputRange: [0.96, 1, 0.96],
              extrapolate: 'clamp',
            });
            const cardOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.78, 1, 0.78],
              extrapolate: 'clamp',
            });
            const cardLift = scrollX.interpolate({
              inputRange,
              outputRange: [6, 0, 6],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={card.title}
                style={{
                  width: heroWidth,
                  minHeight: isCompactHome ? 230 : 218,
                  borderRadius: isCompactHome ? 26 : 28,
                  backgroundColor: card.background,
                  padding: isCompactHome ? 20 : 21,
                  marginRight: 12,
                  overflow: 'hidden',
                  opacity: cardOpacity,
                  transform: [{ translateY: cardLift }, { scale: cardScale }],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    right: -28,
                    bottom: -40,
                    width: isCompactHome ? 158 : 158,
                    height: isCompactHome ? 158 : 158,
                    borderRadius: isCompactHome ? 42 : 44,
                    backgroundColor: '#FFFFFF66',
                    transform: [{ rotate: '-12deg' }],
                  }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: isCompactHome ? 10 : 14 }}>
                  <View style={{ flex: 1, gap: isCompactHome ? 6 : 9 }}>
                    <Text style={{ color: card.foreground, fontSize: isCompactHome ? 30 : 30, fontWeight: '900' }}>
                      {card.title}
                    </Text>
                    <Text
                      style={{
                        color: card.foreground,
                        opacity: 0.76,
                        fontSize: isCompactHome ? 17 : 17,
                        lineHeight: isCompactHome ? 24 : 24,
                        fontWeight: '800',
                      }}
                    >
                      {card.subtitle}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: isCompactHome ? 90 : 88,
                      height: isCompactHome ? 90 : 88,
                      borderRadius: isCompactHome ? 24 : 24,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name={card.icon} size={isCompactHome ? 52 : 50} color={card.accent} />
                  </View>
                </View>

                <View
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: isCompactHome ? 16 : 18,
                    backgroundColor: '#FFFFFF99',
                    paddingHorizontal: isCompactHome ? 13 : 14,
                    paddingVertical: isCompactHome ? 9 : 10,
                    marginTop: isCompactHome ? 18 : 19,
                  }}
                >
                  <Text style={{ color: card.foreground, fontSize: isCompactHome ? 12 : 13, fontWeight: '800' }}>
                    {card.tag}
                  </Text>
                  <Text
                    style={{
                      color: card.foreground,
                      fontSize: isCompactHome ? 22 : 23,
                      fontWeight: '900',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {card.metric}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
          {heroCards.map((card, index) => {
            const inputRange = [
              (index - 1) * snapInterval,
              index * snapInterval,
              (index + 1) * snapInterval,
            ];
            const dotScale = scrollX.interpolate({
              inputRange,
              outputRange: [0.28, 1, 0.28],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={card.title}
                style={{
                  width: isCompactHome ? 24 : 26,
                  height: isCompactHome ? 6 : 7,
                  borderRadius: 4,
                  backgroundColor: card.accent,
                  opacity: dotOpacity,
                  transform: [{ scaleX: dotScale }],
                }}
              />
            );
          })}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: isCompactHome ? 10 : 10,
          paddingTop: isCompactHome ? 4 : 4,
        }}
      >
        {sellerActions.map((action) => (
          <SellerActionTile
            key={action.title}
            action={action}
            compact={isCompactHome}
            onPress={() => router.push(action.route as AppRoute)}
          />
        ))}
      </View>
    </ScrollView>
  );
} 
