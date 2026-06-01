import { ControlHomeScreen } from '@/components/control-home-screen';
import { useControlAuth } from '@/lib/control-auth';
import { Redirect } from 'expo-router';

export default function OwnerHomeRoute() {
  const { session } = useControlAuth();

  if (session?.user.accountRole === 'seller') {
    return <Redirect href="/seller" />;
  }

  if (!session?.user.accountRole) {
    return <Redirect href="/" />;
  }

  return <ControlHomeScreen experienceRole="owner" />;
}
