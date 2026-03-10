import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AccountLayoutShell } from '@/components/account/AccountLayoutShell';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/login');
  }

  return <AccountLayoutShell session={session}>{children}</AccountLayoutShell>;
}
