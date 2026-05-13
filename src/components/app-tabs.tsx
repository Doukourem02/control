import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useControlRole } from '@/context/control-role';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { role } = useControlRole();
  const tabs =
    role === 'owner'
      ? [
          { name: 'index', label: 'Dashboard' },
          { name: 'stores', label: 'Boutiques' },
          { name: 'alerts', label: 'Alertes' },
          { name: 'reports', label: 'Rapports' },
          { name: 'more', label: 'Plus' },
        ]
      : [
          { name: 'index', label: 'Accueil' },
          { name: 'sale', label: 'Vente' },
          { name: 'stock', label: 'Stock' },
          { name: 'expenses', label: 'Depenses' },
          { name: 'cash', label: 'Caisse' },
        ];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
