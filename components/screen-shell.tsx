import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ScreenShell({ title, subtitle, children }: ScreenShellProps) {
  const router = useRouter();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 38,
        gap: 22,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: '#F5F5F3',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.68 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={25} color="#111111" />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ color: '#171717', fontSize: 28, fontWeight: '900' }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={2}
              style={{ color: '#777777', fontSize: 14, fontWeight: '700', marginTop: 2 }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {children}
    </ScrollView>
  );
}
