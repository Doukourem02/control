import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export type SellerAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  tone?: 'primary' | 'danger';
};

type SellerActionTileProps = {
  action: SellerAction;
};

export function SellerActionTile({ action }: SellerActionTileProps) {
  const isPrimary = action.tone === 'primary';
  const isDanger = action.tone === 'danger';

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => ({
        width: isPrimary || isDanger ? '100%' : '48.4%',
        minHeight: isPrimary ? 128 : isDanger ? 94 : 116,
        borderRadius: isPrimary ? 28 : 22,
        backgroundColor: isPrimary ? '#111111' : '#FFFFFF',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: isDanger ? '#F5C7C7' : '#F0EEE9',
        padding: isPrimary ? 20 : 16,
        overflow: 'hidden',
        justifyContent: 'space-between',
        opacity: pressed ? 0.72 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        boxShadow: isPrimary
          ? '0 16px 28px rgba(17, 17, 17, 0.22)'
          : '0 10px 22px rgba(20, 20, 20, 0.06)',
      })}
    >
      <View
        style={{
          position: 'absolute',
          right: isPrimary ? -34 : -28,
          bottom: isPrimary ? -46 : -34,
          width: isPrimary ? 140 : 104,
          height: isPrimary ? 140 : 104,
          borderRadius: isPrimary ? 42 : 34,
          backgroundColor: isPrimary ? '#FFFFFF12' : `${action.accent}10`,
          transform: [{ rotate: '-12deg' }],
        }}
      />

      <View
        style={{
          flexDirection: isPrimary || isDanger ? 'row' : 'column',
          alignItems: isPrimary || isDanger ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <View
          style={{
            width: isPrimary ? 58 : 48,
            height: isPrimary ? 58 : 48,
            borderRadius: isPrimary ? 18 : 16,
            backgroundColor: isPrimary ? '#FFFFFF' : `${action.accent}14`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={action.icon}
            size={isPrimary ? 32 : 28}
            color={isPrimary ? '#111111' : action.accent}
          />
        </View>

        {isPrimary ? (
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
            <MaterialCommunityIcons name="arrow-right" size={28} color="#111111" />
          </View>
        ) : null}
      </View>

      <View style={{ gap: isPrimary ? 4 : 3 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: isPrimary ? '#FFFFFF' : '#171717',
            fontSize: isPrimary ? 34 : isDanger ? 24 : 24,
            lineHeight: isPrimary ? 38 : 28,
            fontWeight: '900',
          }}
        >
          {action.title}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: isPrimary ? '#D8D8D8' : isDanger ? '#A23A3A' : '#777777',
            fontSize: isPrimary ? 17 : 14,
            fontWeight: '800',
          }}
        >
          {action.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}