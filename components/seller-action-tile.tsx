import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export type SellerAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  route?: string;
};

type SellerActionTileProps = {
  action: SellerAction;
  onPress?: () => void;
};

export function SellerActionTile({ action, onPress }: SellerActionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: '48.2%',
        aspectRatio: 1.18,
        borderRadius: 26,
        borderCurve: 'continuous',
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#F1F1F1',
        padding: 18,
        justifyContent: 'space-between',
        opacity: pressed ? 0.68 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: `${action.accent}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={action.icon} size={27} color={action.accent} />
      </View>

      <View style={{ gap: 5 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={{ color: '#111111', fontSize: 24, fontWeight: '800' }}
        >
          {action.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: '#A1A1A1', fontSize: 16, fontWeight: '600' }}
        >
          {action.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
