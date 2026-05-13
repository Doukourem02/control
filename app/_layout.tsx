import { StockStoreProvider } from '@/components/stock-store';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <StockStoreProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </StockStoreProvider>
  );
}
