import { AuthProvider, useControlAuth } from '@/lib/control-auth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

function AuthGate() {
  const { session, loading } = useControlAuth();
  const router = useRouter();
  const segments = useSegments();
  const isAuthRoute = segments[0] === 'auth';

  useEffect(() => {
    if (loading) return;

    if (!session && !isAuthRoute) {
      router.replace('/auth');
      return;
    }

    if (session && isAuthRoute) {
      router.replace('/');
    }
  }, [isAuthRoute, loading, router, session]);

  if (loading) return null;
  if (!session && !isAuthRoute) return null;
  if (session && isAuthRoute) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
