import { SellerActionTile, type SellerAction } from '@/components/seller-action-tile';
import { useStockStore } from '@/components/stock-store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

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

type CarouselRef = {
  scrollTo?: (options: { x: number; y?: number; animated?: boolean }) => void;
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
  const { width } = useWindowDimensions();
  const carouselRef = useRef<CarouselRef | null>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const heroWidth = Math.min(width - 40, 430);
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
      const nextIndex = (activeIndexRef.current + 1) % 3;

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      carouselRef.current?.scrollTo?.({
        x: nextIndex * snapInterval,
        y: 0,
        animated: true,
      });
    }, 3400);

    return () => clearInterval(carouselTimer);
  }, [snapInterval]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 36,
        gap: 16,
      }}
    >
      <View style={{ gap: 16 }}>
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
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#111111',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.72 : 1,
              boxShadow: '0 8px 16px rgba(17, 17, 17, 0.12)',
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '900' }}>MD</Text>
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#8A8580', fontSize: 15, fontWeight: '600' }}>Hey</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={{ color: '#211716', fontSize: 19, fontWeight: '900' }}
            >
              Mohamed DOUKOURE
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/customize')}
            style={({ pressed }: { pressed: boolean }) => ({
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#D8D4CF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.68 : 1,
            })}
          >
            <Ionicons name="add" size={28} color="#111111" />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: 21,
              borderWidth: 1.5,
              borderColor: '#E4E1DD',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <Ionicons name="search" size={21} color="#8F8A85" />
            <TextInput
              placeholder="Rechercher..."
              placeholderTextColor="#8F8A85"
              style={{
                flex: 1,
                color: '#171717',
                fontSize: 17,
                fontWeight: '600',
                paddingVertical: 0,
              }}
            />
          </View>

          <Pressable
            style={({ pressed }: { pressed: boolean }) => ({
              width: 52,
              height: 52,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.68 : 1,
              boxShadow: '0 8px 16px rgba(20, 20, 20, 0.06)',
            })}
          >
            <Ionicons name="filter" size={25} color="#111111" />
          </Pressable>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);

            activeIndexRef.current = nextIndex;
            setActiveIndex(nextIndex);
          }}
        >
          {heroCards.map((card) => (
            <View
              key={card.title}
              style={{
                width: heroWidth,
                minHeight: 218,
                borderRadius: 28,
                backgroundColor: card.background,
                padding: 21,
                marginRight: 12,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  right: -28,
                  bottom: -40,
                  width: 158,
                  height: 158,
                  borderRadius: 44,
                  backgroundColor: '#FFFFFF66',
                  transform: [{ rotate: '-12deg' }],
                }}
              />

              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <View style={{ flex: 1, gap: 9 }}>
                  <Text style={{ color: card.foreground, fontSize: 30, fontWeight: '900' }}>
                    {card.title}
                  </Text>
                  <Text
                    style={{
                      color: card.foreground,
                      opacity: 0.76,
                      fontSize: 17,
                      lineHeight: 24,
                      fontWeight: '800',
                    }}
                  >
                    {card.subtitle}
                  </Text>
                </View>

                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 24,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name={card.icon} size={50} color={card.accent} />
                </View>
              </View>

              <View
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: 18,
                  backgroundColor: '#FFFFFF99',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginTop: 19,
                }}
              >
                <Text style={{ color: card.foreground, fontSize: 13, fontWeight: '800' }}>
                  {card.tag}
                </Text>
                <Text
                  style={{
                    color: card.foreground,
                    fontSize: 23,
                    fontWeight: '900',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {card.metric}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7 }}>
          {heroCards.map((card, index) => {
            const isActive = activeIndex === index;

            return (
              <View
                key={card.title}
                style={{
                  width: isActive ? 26 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: card.accent,
                  opacity: isActive ? 1 : 0.28,
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
          gap: 10,
          paddingTop: 4,
        }}
      >
        {sellerActions.map((action) => (
          <SellerActionTile
            key={action.title}
            action={action}
            onPress={() => router.push(action.route as AppRoute)}
          />
        ))}
      </View>
    </ScrollView>
  );
} 
