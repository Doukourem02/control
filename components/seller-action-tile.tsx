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
  onPress?: () => void;
};

export function SellerActionTile({ action, onPress }: SellerActionTileProps) {
  const isPrimary = action.tone === 'primary';
  const isSummary = action.tone === 'summary';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: isPrimary || isSummary ? '100%' : '48.4%',
        minHeight: isPrimary ? 120 : isSummary ? 86 : 108,
        borderRadius: isPrimary ? 28 : 24,
        backgroundColor: isPrimary ? '#111111' : isSummary ? '#EFFAF6' : '#FFFFFF',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: isSummary ? '#D8EFE6' : '#F0EEE9',
        padding: isPrimary ? 20 : isSummary ? 16 : 15,
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
          bottom: isPrimary ? -46 : isSummary ? -52 : -34,
          width: isPrimary ? 140 : isSummary ? 132 : 104,
          height: isPrimary ? 140 : isSummary ? 132 : 104,
          borderRadius: isPrimary ? 42 : isSummary ? 40 : 34,
          backgroundColor: isPrimary ? '#FFFFFF12' : `${action.accent}0F`,
          transform: [{ rotate: '-12deg' }],
        }}
      />

      <View
        style={{
          flexDirection: isPrimary || isSummary ? 'row' : 'column',
          alignItems: isPrimary || isSummary ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View
          style={{
            width: isPrimary ? 58 : isSummary ? 50 : 48,
            height: isPrimary ? 58 : isSummary ? 50 : 48,
            borderRadius: isPrimary ? 18 : isSummary ? 17 : 16,
            backgroundColor: isPrimary ? '#FFFFFF' : `${action.accent}14`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={action.icon}
            size={isPrimary ? 32 : isSummary ? 29 : 28}
            color={isPrimary ? '#111111' : action.accent}
          />
        </View>

        {isPrimary || isSummary ? (
          <View
            style={{
              width: isPrimary ? 48 : 42,
              height: isPrimary ? 48 : 42,
              borderRadius: isPrimary ? 24 : 21,
              backgroundColor: isPrimary ? '#FFFFFF' : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons
              name="arrow-right"
              size={isPrimary ? 28 : 24}
              color={isPrimary ? '#111111' : action.accent}
            />
          </View>
        ) : null}
      </View>

      <View style={{ gap: isPrimary ? 4 : 3 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: isPrimary ? '#FFFFFF' : '#171717',
            fontSize: isPrimary ? 34 : isSummary ? 25 : 23,
            lineHeight: isPrimary ? 38 : isSummary ? 29 : 27,
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
            fontSize: isPrimary ? 17 : isSummary ? 14 : 13,
            fontWeight: '800',
          }}
        >
          {action.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
