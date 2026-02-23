import { redirect } from 'next/navigation';
import { SettingsDashboardPage } from '@/components/settings/SettingsDashboardPage';
import { getSession } from '@/lib/auth/session';

export default async function AdminSettingsPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/login');
  }

  return <SettingsDashboardPage session={session} />;
}

