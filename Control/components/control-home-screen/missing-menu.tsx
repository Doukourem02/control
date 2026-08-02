import type { TodaySummary } from '@/lib/control-data';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ComponentProps } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { ControlExperienceRole } from './shared-ui';
import { formatMoney } from './utils';

export function EcartsTile({
  title,
  subtitle,
  icon,
  accent,
  compact,
  subtitleColor = '#A8A8A8',
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  accent: string;
  compact: boolean;
  subtitleColor?: string;
  onPress?: () => void;
}) {
  const iconSize = compact ? 40 : 44;
  const glyphSize = compact ? 20 : 22;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: '48%',
        height: compact ? 158 : 176,
        borderRadius: 28,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        paddingTop: compact ? 22 : 24,
        paddingHorizontal: compact ? 22 : 24,
        paddingBottom: compact ? 20 : 22,
        opacity: pressed ? 0.68 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.018)',
      })}
    >
      <View
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 14,
          borderCurve: 'continuous',
          backgroundColor: accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon} size={glyphSize} color="#FFFFFF" />
      </View>

      <View style={{ gap: 5, marginTop: compact ? 30 : 40 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={{
            color: '#111111',
            fontSize: compact ? 17 : 18,
            lineHeight: compact ? 21 : 22,
            fontWeight: '700',
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: subtitleColor,
            fontSize: compact ? 14 : 15,
            lineHeight: compact ? 17 : 18,
            fontWeight: '400',
          }}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export function MissingMenu({
  compact,
  amountsVisible,
  role,
  summary,
  onOpenCashJournal,
  onOpenExpense,
  onOpenMissing,
  onOpenMissingHistory,
}: {
  compact: boolean;
  amountsVisible: boolean;
  role: ControlExperienceRole | null;
  summary: TodaySummary;
  onOpenCashJournal: () => void;
  onOpenExpense: () => void;
  onOpenMissing: () => void;
  onOpenMissingHistory: () => void;
}) {
  const hiddenValue = '•••';
  const hasGap = summary.latestCashGap !== 0;
  const gapColor = summary.latestCashGap < 0 ? '#E5484D' : '#34C875';
  const expectedValue = amountsVisible ? formatMoney(summary.physicalCashExpected) : hiddenValue;
  const latestGapValue = amountsVisible ? formatMoney(summary.latestCashGap) : hiddenValue;
  const showSellerCashJournal = role === 'seller';

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: compact ? 24 : 34,
        paddingBottom: compact ? 104 : 118,
        gap: 26,
      }}
    >
      <View style={{ gap: 14 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Contrôle caisse</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
          <EcartsTile
            title="Cash attendu"
            subtitle={expectedValue}
            subtitleColor="#A8A8A8"
            icon="cash"
            accent="#4C9BFF"
            compact={compact}
          />
          <EcartsTile
            title="Dernier écart"
            subtitle={latestGapValue}
            subtitleColor={hasGap ? gapColor : '#A8A8A8'}
            icon={hasGap ? 'alert' : 'check'}
            accent="#FF8A4C"
            compact={compact}
          />
        </View>
      </View>

      {showSellerCashJournal ? (
        <View style={{ gap: 14 }}>
          <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Journal caisse</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
            <EcartsTile
              title="Mouvements"
              subtitle="Ventes et sorties"
              icon="history"
              accent="#3B3B3B"
              compact={compact}
              onPress={onOpenCashJournal}
            />
            <EcartsTile
              title="Dépense"
              subtitle="Sortie caisse"
              icon="cash-minus"
              accent="#F59E0B"
              compact={compact}
              onPress={onOpenExpense}
            />
          </View>
        </View>
      ) : null}

      <View style={{ gap: 14 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Stock</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
          <EcartsTile
            title="Historique"
            subtitle="Manquants stock"
            icon="clipboard-list-outline"
            accent="#3B3B3B"
            compact={compact}
            onPress={onOpenMissingHistory}
          />
          <EcartsTile
            title="Manquant"
            subtitle="Déclarer une perte"
            icon="alert-outline"
            accent="#E5484D"
            compact={compact}
            onPress={onOpenMissing}
          />
        </View>
      </View>

      {!hasGap ? (
        <View
          style={{
            borderRadius: 22,
            borderCurve: 'continuous',
            backgroundColor: '#F7F7F7',
            paddingHorizontal: 20,
            paddingVertical: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              borderCurve: 'continuous',
              backgroundColor: '#E8F8F0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="check" size={20} color="#08784F" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>Rien à signaler</Text>
            <Text style={{ color: '#8E8E8E', fontSize: 13, lineHeight: 18, marginTop: 2 }}>
              Aucun écart de caisse et aucun manquant en attente.
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
