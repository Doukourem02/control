import type { SellerAction } from '@/components/seller-action-tile';
import { colors } from '@/lib/theme';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ComponentProps, type ReactNode, useEffect, useRef } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';

export type NavKey = 'home' | 'report' | 'missing' | 'profile';
export type ControlExperienceRole = 'owner' | 'seller';

export type NavIcon =
  | { family: 'asset'; name: 'home' | 'report' | 'missing' }
  | { family: 'material'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

export const quickActions: SellerAction[] = [
  {
    title: 'Vente',
    subtitle: 'Nouvelle vente',
    icon: { family: 'feather', name: 'arrow-up-right' },
    accent: colors.primaryMuted,
  },
  {
    title: 'Stock',
    subtitle: 'Articles',
    icon: { family: 'material', name: 'cube-outline' },
    accent: colors.accentOrange,
  },
  {
    title: 'Clôture',
    subtitle: 'Fin de journée',
    icon: { family: 'material', name: 'credit-card-outline' },
    accent: colors.accentDeep,
  },
  {
    title: 'Sortie',
    subtitle: 'Dépense caisse',
    icon: { family: 'material', name: 'currency-usd' },
    accent: colors.gray800,
  },
];

export function NavAssetIcon({
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
      ? require('../../assets/icons/home-flaticon-9664027.png')
      : name === 'report'
        ? require('../../assets/icons/diagram-flaticon-9637699.png')
        : require('../../assets/icons/wallet-flaticon-9122560.png');

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

export function BottomNav({
  active = 'home',
  compact = false,
  role,
  onChange,
  onQuickActions,
}: {
  active?: NavKey;
  compact?: boolean;
  role?: ControlExperienceRole | null;
  onChange?: (key: NavKey) => void;
  onQuickActions?: () => void;
}) {
  const navHeight = compact ? 66 : 68;
  const itemSize = compact ? 50 : 52;
  const baseItems: {
    key: NavKey;
    icon: NavIcon;
  }[] = role === 'seller'
    ? [
        { key: 'home', icon: { family: 'asset', name: 'home' } },
        { key: 'missing', icon: { family: 'asset', name: 'missing' } },
        { key: 'profile', icon: { family: 'material', name: 'cog' } },
      ]
    : [
        { key: 'home', icon: { family: 'asset', name: 'home' } },
        { key: 'report', icon: { family: 'asset', name: 'report' } },
        { key: 'missing', icon: { family: 'asset', name: 'missing' } },
        { key: 'profile', icon: { family: 'material', name: 'cog' } },
      ];
  const items = baseItems;
  const splitAt = Math.ceil(items.length / 2);
  const beforeItems = items.slice(0, splitAt);
  const afterItems = items.slice(splitAt);
  const fabSize = itemSize;

  return (
    <View
      style={{
        alignSelf: 'center',
        width: onQuickActions ? '70%' : '66%',
        minWidth: onQuickActions ? 260 : 244,
        maxWidth: onQuickActions ? 304 : 292,
        height: navHeight,
        borderRadius: 40,
        backgroundColor: colors.white,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 18px 34px rgba(0, 0, 0, 0.07)',
      }}
    >
      {beforeItems.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          isActive={active === item.key}
          compact={compact}
          itemSize={itemSize}
          onPress={() => onChange?.(item.key)}
        />
      ))}

      {onQuickActions ? (
        <Pressable
          onPress={onQuickActions}
          style={({ pressed }: { pressed: boolean }) => ({
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            marginTop: compact ? -9 : -10,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.94 : 1 }],
            boxShadow: '0 10px 20px rgba(10, 116, 254, 0.28)',
          })}
        >
          <Feather name="plus" size={20} color={colors.white} />
        </Pressable>
      ) : null}

      {afterItems.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          isActive={active === item.key}
          compact={compact}
          itemSize={itemSize}
          onPress={() => onChange?.(item.key)}
        />
      ))}
    </View>
  );
}

function NavItem({
  item,
  isActive,
  compact,
  itemSize,
  onPress,
}: {
  item: { key: NavKey; icon: NavIcon };
  isActive: boolean;
  compact: boolean;
  itemSize: number;
  onPress: () => void;
}) {
  const highlight = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(highlight, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 90,
    }).start();
  }, [highlight, isActive]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: itemSize,
        height: itemSize,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.64 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: itemSize,
          height: itemSize,
          borderRadius: itemSize / 2,
          backgroundColor: colors.primarySoft,
          opacity: highlight,
          transform: [{ scale: highlight.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}
      />
      {item.icon.family === 'asset' ? (
        <NavAssetIcon
          name={item.icon.name}
          size={compact ? 25 : 26}
          color={isActive ? colors.primary : colors.gray400}
        />
      ) : (
        <MaterialCommunityIcons
          name={item.icon.name}
          size={compact ? 25 : 26}
          color={isActive ? colors.primary : colors.gray400}
        />
      )}
    </Pressable>
  );
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  destructive = false,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: subtitle ? 54 : 45,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.68 : 1,
      })}
    >
      <MaterialCommunityIcons name={icon} size={21} color={destructive ? colors.dangerDark : colors.gray900} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            color: destructive ? colors.dangerDark : colors.gray900,
            fontSize: subtitle ? 15 : 16,
            fontWeight: subtitle ? '700' : '500',
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ color: colors.gray500, fontSize: 13, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text
          numberOfLines={1}
          style={{
            color: colors.gray700,
            fontSize: 15,
            fontWeight: '500',
            maxWidth: 166,
            textAlign: 'right',
          }}
        >
          {value}
        </Text>
      ) : null}
      {onPress ? <Feather name="chevron-right" size={19} color={colors.gray400} /> : null}
    </Pressable>
  );
}

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: colors.gray50,
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 7,
      }}
    >
      <Text style={{ color: colors.gray900, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

export function PreferenceToggle({
  title,
  subtitle,
  enabled,
  onToggle,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: 54,
        borderRadius: 18,
        backgroundColor: colors.gray50,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.gray900, fontSize: 15, fontWeight: '800' }}>{title}</Text>
        <Text numberOfLines={1} style={{ color: colors.gray600, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={enabled ? 'check-circle' : 'circle-outline'}
        size={24}
        color={enabled ? colors.success : colors.gray400}
      />
    </Pressable>
  );
}

export function DashedVerticalLine({ top, height, left }: { top: number; height: number; left: number }) {
  const dashHeight = 6;
  const gap = 5;
  const dashCount = Math.max(0, Math.floor(height / (dashHeight + gap)));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top, height, width: 1, zIndex: 1 }}>
      {Array.from({ length: dashCount }).map((_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            top: index * (dashHeight + gap),
            width: 1,
            height: dashHeight,
            backgroundColor: colors.gray900,
            opacity: 0.82,
          }}
        />
      ))}
    </View>
  );
}
