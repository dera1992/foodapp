import { redirect } from 'next/navigation';
import { DispatcherOnboardingClient } from './DispatcherOnboardingClient';
import { getSession } from '@/lib/auth/session';

export default async function DispatcherOnboardingPage() {
  const session = await getSession();
  if (!session.isAuthenticated) {
    redirect('/login');
  }
  if (session.role && session.role !== 'dispatcher') {
    redirect('/');
  }

  return <DispatcherOnboardingClient />;
}

