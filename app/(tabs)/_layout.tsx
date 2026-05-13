import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useControlRole } from '@/context/control-role';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { role } = useControlRole();
  const isOwner = role === 'owner';
  const { width } = useWindowDimensions();
  const navWidth = Math.min(width - 40, 420);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.navBar,
          { backgroundColor: colors.background, width: navWidth, marginLeft: -navWidth / 2 },
        ],
        tabBarItemStyle: styles.tabBarItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isOwner ? 'Dashboard' : 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={isOwner ? 'analytics' : 'home'} />
          ),
        }}
      />

      <Tabs.Screen
        name="sale"
        options={{
          title: 'Vente',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="cart" />,
        }}
      />

      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="cube" />,
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'Plus',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="ellipsis-horizontal" />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ focused, name }: { focused: boolean; name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[styles.iconContainer, focused && styles.activeIcon]}>
      <Ionicons name={name} size={20} color={focused ? '#fff' : '#4B5563'} />
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 25,
    left: '50%',
    height: 80,
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 7,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  activeIcon: {
    backgroundColor: '#8B5CF6',
  },
});
