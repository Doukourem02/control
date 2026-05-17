import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export type SellerAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  accent: string;
};

type SellerActionTileProps = {
  action: SellerAction;
  compact?: boolean;
  onPress?: () => void;
};

export function SellerActionTile({ action, compact = false, onPress }: SellerActionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: '48%',
        height: compact ? 122 : 136,
        borderRadius: 30,
        borderCurve: 'continuous',
        backgroundColor: '#F8F8F8',
        borderWidth: 1,
        borderColor: '#F1F1F1',
        padding: compact ? 18 : 22,
        justifyContent: 'space-between',
        opacity: pressed ? 0.68 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.025)',
      })}
    >
      <View
        style={{
          width: compact ? 48 : 52,
          height: compact ? 48 : 52,
          borderRadius: 18,
          borderCurve: 'continuous',
          backgroundColor: `${action.accent}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={action.icon} size={22} color={action.accent} />
      </View>

      <View style={{ gap: 4 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={{ color: '#111111', fontSize: compact ? 20 : 21, fontWeight: '700' }}
        >
          {action.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: '#A6A6A6', fontSize: compact ? 14 : 15, fontWeight: '400' }}
        >
          {action.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
