import { getMyDispatcherProfile, getDispatcherAnalytics } from '@/lib/api/endpoints';
import { DispatcherDashboardPage } from '@/components/dispatcher-portal/DispatcherDashboardPage';
import type { DispatcherStats } from '@/components/dispatcher-portal/DispatcherDashboardPage';

export default async function DispatcherDashboard() {
  const [profile, stats] = await Promise.all([
    getMyDispatcherProfile().catch(() => null),
    getDispatcherAnalytics().catch(() => null),
  ]);

  return (
    <DispatcherDashboardPage
      profile={profile}
      stats={(stats ?? null) as DispatcherStats | null}
    />
  );
}
