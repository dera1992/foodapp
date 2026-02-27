import { SettingsDashboardPage } from '@/components/settings/SettingsDashboardPage';
import { getSession } from '@/lib/auth/session';

export default async function DispatcherSettingsPage() {
  const session = await getSession();
  return <SettingsDashboardPage session={session} />;
}
