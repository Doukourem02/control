import { ControlHomeScreen } from '@/components/control-home-screen';
import { useControlAuth } from '@/lib/control-auth';
import { Redirect } from 'expo-router';

export default function SellerHomeRoute() {
  const { session } = useControlAuth();

  if (session?.user.accountRole === 'owner') {
    return <Redirect href="/owner" />;
  }

  if (!session?.user.accountRole) {
    return <Redirect href="/" />;
  }

  return <ControlHomeScreen experienceRole="seller" />;
}
