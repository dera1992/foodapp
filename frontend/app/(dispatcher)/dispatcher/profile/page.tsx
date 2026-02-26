import { getMyDispatcherProfile } from '@/lib/api/endpoints';
import { DispatcherProfilePage } from '@/components/dispatcher-portal/DispatcherProfilePage';

export default async function DispatcherProfileRoute() {
  const profile = await getMyDispatcherProfile().catch(() => null);
  return <DispatcherProfilePage profile={profile} />;
}
