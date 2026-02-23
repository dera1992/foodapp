import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CustomerSetupCard } from '@/components/account/CustomerSetupCard';

export const metadata: Metadata = {
  title: 'Complete Your Profile – Bunchfood',
  description: 'Add your contact details to complete your customer account.',
};

export default async function CustomerSetupPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/login?next=/account/customer/setup');
  }

  return (
    <div className="bf-cs-page">
      <Breadcrumb
        items={[
          { label: '🏠 Home', href: '/' },
          { label: 'Customer Setup' },
        ]}
      />
      <CustomerSetupCard />
    </div>
  );
}
