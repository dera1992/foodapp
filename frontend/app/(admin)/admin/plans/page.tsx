import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getSubscriptionPlans } from '@/lib/api/endpoints';
import { PlansAdminClient } from './PlansAdminClient';

export const metadata = { title: 'Subscription Plans – Bunchfood Admin' };

export default async function AdminPlansPage() {
  const session = await getSession();
  if (!session.isAuthenticated) redirect('/login');

  const plans = await getSubscriptionPlans().catch(() => []);

  return (
    <div className="p-6">
      <PlansAdminClient initialPlans={plans} />
    </div>
  );
}
