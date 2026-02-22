import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { ChooseRoleClient } from './ChooseRoleClient';

export default async function ChooseRolePage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/login');
  }

  if (session.role) {
    if (session.role === 'shop') redirect('/account/shop/onboarding');
    if (session.role === 'dispatcher') redirect('/account/dispatcher/onboarding');
    if (session.role === 'admin') redirect('/admin');
    redirect('/');
  }

  return <ChooseRoleClient />;
}

