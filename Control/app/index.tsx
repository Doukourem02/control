import { ControlHomeScreen } from '@/components/control-home-screen';
import { toExperienceRole, useControlAuth } from '@/lib/control-auth';
import { Redirect } from 'expo-router';

export default function HomeRoute() {
  const { session } = useControlAuth();
  const experience = toExperienceRole(session?.user.accountRole);

  if (experience === 'owner') {
    return <Redirect href="/owner" />;
  }

  if (experience === 'seller') {
    return <Redirect href="/seller" />;
  }

  return <ControlHomeScreen />;
}
