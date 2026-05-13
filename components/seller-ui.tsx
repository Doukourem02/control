import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type CardProps = {
  children: ReactNode;
  accent?: string;
};

type PrimaryButtonProps = {
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  onPress?: () => void;
};

export function Card({ children, accent = '#F5F5F3' }: CardProps) {
  return (
    <View
      style={{
        borderRadius: 24,
        backgroundColor: accent,
        padding: 18,
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={{ color: '#171717', fontSize: 20, fontWeight: '900' }}>{children}</Text>;
}

export function PrimaryButton({ title, icon = 'check', disabled, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: 58,
        borderRadius: 22,
        backgroundColor: disabled ? '#D8D8D8' : '#111111',
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
      <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '900' }}>{title}</Text>
    </Pressable>
  );
}

export function InfoRow({
  label,
  value,
  icon,
  accent = '#111111',
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent?: string;
}) {
  return (
    <View
      style={{
        minHeight: 72,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0EEE9',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 15,
          backgroundColor: `${accent}14`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon} size={25} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#777777', fontSize: 13, fontWeight: '800' }}>{label}</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color: '#171717', fontSize: 18, fontWeight: '900' }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ChoicePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 42,
        borderRadius: 21,
        paddingHorizontal: 16,
        backgroundColor: active ? '#111111' : '#F5F5F3',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: active ? '#FFFFFF' : '#68635F', fontSize: 14, fontWeight: '900' }}>
        {label}
      </Text>
    </Pressable>
  );
}
