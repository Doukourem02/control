import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

type ActionIcon =
  | { family: 'feather'; name: ComponentProps<typeof Feather>['name'] }
  | { family: 'material'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

export type SellerAction = {
  title: string;
  subtitle: string;
  icon: ActionIcon;
  accent: string;
};

type SellerActionTileProps = {
  action: SellerAction;
  compact?: boolean;
  onPress?: () => void;
};

export function SellerActionTile({ action, compact = false, onPress }: SellerActionTileProps) {
  const iconSize = compact ? 40 : 44;
  const glyphSize = compact ? 20 : 22;

  return (
    <Pressable
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
          backgroundColor: action.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {action.icon.family === 'material' ? (
          <MaterialCommunityIcons name={action.icon.name} size={glyphSize} color="#FFFFFF" />
        ) : (
          <Feather name={action.icon.name} size={glyphSize} color="#FFFFFF" />
        )}
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
          {action.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: '#A8A8A8',
            fontSize: compact ? 14 : 15,
            lineHeight: compact ? 17 : 18,
            fontWeight: '400',
          }}
        >
          {action.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
