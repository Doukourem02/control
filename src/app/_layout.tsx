import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ControlRoleProvider } from '@/context/control-role';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ControlRoleProvider>
        <AppTabs />
      </ControlRoleProvider>
    </ThemeProvider>
  );
}
