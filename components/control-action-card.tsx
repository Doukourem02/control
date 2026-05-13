import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export type ControlAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  dark?: boolean;
  wide?: boolean;
};

type ControlActionCardProps = {
  action: ControlAction;
};

export function ControlActionCard({ action }: ControlActionCardProps) {
  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => ({
        width: action.wide ? '100%' : '48%',
        minHeight: action.wide ? 132 : 164,
        borderRadius: action.wide ? 28 : 24,
        backgroundColor: action.dark ? '#111111' : '#FFFFFF',
        padding: action.wide ? 22 : 18,
        justifyContent: 'space-between',
        opacity: pressed ? 0.78 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        boxShadow: action.dark
          ? '0 16px 28px rgba(17, 17, 17, 0.24)'
          : '0 12px 22px rgba(20, 20, 20, 0.07)',
      })}
    >
      <View
        style={{
          width: action.wide ? 62 : 52,
          height: action.wide ? 62 : 52,
          borderRadius: action.wide ? 18 : 16,
          backgroundColor: action.dark ? '#FFFFFF' : `${action.accent}14`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name={action.icon}
          size={action.wide ? 34 : 29}
          color={action.dark ? '#111111' : action.accent}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text
          numberOfLines={2}
          style={{
            color: action.dark ? '#FFFFFF' : '#171717',
            fontSize: action.wide ? 34 : 25,
            lineHeight: action.wide ? 38 : 29,
            fontWeight: '900',
          }}
        >
          {action.title}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            color: action.dark ? '#D6D6D6' : '#777777',
            fontSize: action.wide ? 18 : 17,
            lineHeight: action.wide ? 23 : 21,
            fontWeight: '800',
          }}
        >
          {action.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
