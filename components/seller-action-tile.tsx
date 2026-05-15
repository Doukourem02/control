import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export type SellerAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  tone?: 'primary' | 'summary';
  route?: string;
};

type SellerActionTileProps = {
  action: SellerAction;
  compact?: boolean;
  onPress?: () => void;
};

export function SellerActionTile({ action, compact = false, onPress }: SellerActionTileProps) {
  const isPrimary = action.tone === 'primary';
  const isSummary = action.tone === 'summary';

  if (compact) {
    const isWide = isPrimary || isSummary;
    const mainLabel = isPrimary ? action.subtitle : action.title;
    const detailLabel = isPrimary ? action.title : action.subtitle;
    const backgroundColor = isPrimary ? '#111111' : isSummary ? '#EFFAF6' : '#FFFFFF';
    const borderColor = isPrimary ? '#111111' : isSummary ? '#D8EFE6' : '#F0EEE9';
    const textColor = isPrimary ? '#FFFFFF' : '#171717';
    const detailColor = isPrimary ? '#D8D8D8' : isSummary ? '#367A60' : '#777777';

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }: { pressed: boolean }) => ({
          width: isWide ? '100%' : '48.7%',
          height: isPrimary ? 118 : isSummary ? 112 : 114,
          borderRadius: isWide ? 26 : 24,
          backgroundColor,
          borderWidth: isPrimary ? 0 : 1,
          borderColor,
          paddingHorizontal: 17,
          paddingVertical: 14,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: pressed ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          boxShadow: isPrimary
            ? '0 10px 18px rgba(17, 17, 17, 0.18)'
            : '0 6px 14px rgba(20, 20, 20, 0.04)',
        })}
      >
        <View
          style={{
            position: 'absolute',
            right: isWide ? -34 : -28,
            bottom: isWide ? -54 : -44,
            width: isWide ? 138 : 114,
            height: isWide ? 138 : 114,
            borderRadius: isWide ? 40 : 34,
            backgroundColor: isPrimary ? '#FFFFFF12' : `${action.accent}0F`,
            transform: [{ rotate: '-12deg' }],
          }}
        />

        <View
          style={{
            width: isWide ? 58 : 54,
            height: isWide ? 58 : 54,
            borderRadius: isWide ? 18 : 17,
            backgroundColor: isPrimary ? '#FFFFFF' : `${action.accent}14`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={action.icon}
            size={isWide ? 33 : 31}
            color={isPrimary ? '#111111' : action.accent}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: textColor,
              fontSize: isWide ? 32 : 26,
              lineHeight: isWide ? 35 : 29,
              fontWeight: '900',
            }}
          >
            {mainLabel}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: detailColor,
              fontSize: isWide ? 15 : 14,
              fontWeight: '800',
            }}
          >
            {detailLabel}
          </Text>
        </View>

        {isWide ? (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="arrow-right"
              size={28}
              color={isPrimary ? '#111111' : action.accent}
            />
          </View>
        ) : null}
      </Pressable>
    );
  }

  const tileHeight = isPrimary
    ? compact
      ? 78
      : 120
    : isSummary
      ? compact
        ? 66
        : 86
      : compact
        ? 74
        : 108;
  const iconBoxSize = isPrimary ? (compact ? 42 : 58) : isSummary ? (compact ? 40 : 50) : compact ? 38 : 48;
  const arrowSize = isPrimary ? (compact ? 38 : 48) : compact ? 34 : 42;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: isPrimary || isSummary ? '100%' : '48.4%',
        minHeight: tileHeight,
        borderRadius: isPrimary ? (compact ? 22 : 28) : compact ? 18 : 24,
        backgroundColor: isPrimary ? '#111111' : isSummary ? '#EFFAF6' : '#FFFFFF',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: isSummary ? '#D8EFE6' : '#F0EEE9',
        padding: isPrimary ? (compact ? 14 : 20) : isSummary ? (compact ? 11 : 16) : compact ? 10 : 15,
        overflow: 'hidden',
        justifyContent: 'space-between',
        opacity: pressed ? 0.72 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        boxShadow: isPrimary
          ? '0 16px 28px rgba(17, 17, 17, 0.22)'
          : '0 8px 18px rgba(20, 20, 20, 0.045)',
      })}
    >
      <View
        style={{
          position: 'absolute',
          right: isPrimary ? -34 : isSummary ? -20 : -30,
          bottom: isPrimary ? (compact ? -68 : -46) : isSummary ? -52 : -34,
          width: isPrimary ? (compact ? 104 : 140) : isSummary ? (compact ? 100 : 132) : compact ? 78 : 104,
          height: isPrimary ? (compact ? 104 : 140) : isSummary ? (compact ? 100 : 132) : compact ? 78 : 104,
          borderRadius: isPrimary ? (compact ? 32 : 42) : isSummary ? (compact ? 30 : 40) : compact ? 24 : 34,
          backgroundColor: isPrimary ? '#FFFFFF12' : `${action.accent}0F`,
          transform: [{ rotate: '-12deg' }],
        }}
      />

      <View
        style={{
          flexDirection: isPrimary || isSummary ? 'row' : 'column',
          alignItems: isPrimary || isSummary ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          gap: compact ? 7 : 12,
        }}
      >
        <View
          style={{
            width: iconBoxSize,
            height: iconBoxSize,
            borderRadius: isPrimary ? (compact ? 14 : 18) : isSummary ? (compact ? 14 : 17) : compact ? 13 : 16,
            backgroundColor: isPrimary ? '#FFFFFF' : `${action.accent}14`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={action.icon}
            size={isPrimary ? (compact ? 24 : 32) : isSummary ? (compact ? 23 : 29) : compact ? 22 : 28}
            color={isPrimary ? '#111111' : action.accent}
          />
        </View>

        {isPrimary || isSummary ? (
          <View
            style={{
              width: arrowSize,
              height: arrowSize,
              borderRadius: arrowSize / 2,
              backgroundColor: isPrimary ? '#FFFFFF' : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="arrow-right"
              size={isPrimary ? (compact ? 23 : 28) : compact ? 20 : 24}
              color={isPrimary ? '#111111' : action.accent}
            />
          </View>
        ) : null}
      </View>

      <View style={{ gap: isPrimary ? (compact ? 2 : 4) : 3 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: isPrimary ? '#FFFFFF' : '#171717',
            fontSize: isPrimary ? (compact ? 23 : 34) : isSummary ? (compact ? 20 : 25) : compact ? 18 : 23,
            lineHeight: isPrimary ? (compact ? 26 : 38) : isSummary ? (compact ? 23 : 29) : compact ? 21 : 27,
            fontWeight: '900',
          }}
        >
          {action.title}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: isPrimary ? '#D8D8D8' : isSummary ? '#367A60' : '#777777',
            fontSize: isPrimary ? (compact ? 12 : 17) : isSummary ? (compact ? 12 : 14) : compact ? 11 : 13,
            fontWeight: '800',
          }}
        >
          {action.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
