import { getSession } from '@/lib/auth/session';
import { SettingsDashboardPage } from '@/components/settings/SettingsDashboardPage';

export default async function AccountSettingsPage() {
  const session = await getSession();
  return <SettingsDashboardPage session={session} />;
}

