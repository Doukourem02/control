import { ControlHomeScreen } from '@/components/control-home-screen';
import { toExperienceRole, useControlAuth } from '@/lib/control-auth';
import { Redirect } from 'expo-router';

export default function OwnerHomeRoute() {
  const { session } = useControlAuth();
  const experience = toExperienceRole(session?.user.accountRole);

  if (experience === 'seller') {
    return <Redirect href="/seller" />;
  }

  if (!experience) {
    return <Redirect href="/" />;
  }

  return <ControlHomeScreen experienceRole="owner" />;
}
