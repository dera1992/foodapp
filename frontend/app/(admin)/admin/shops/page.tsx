import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getShops } from '@/lib/api/endpoints';
import { ShopsAdminClient } from './ShopsAdminClient';

export const metadata = { title: 'Manage Shops – Bunchfood Admin' };

export default async function AdminShopsPage() {
  const session = await getSession();
  if (!session.isAuthenticated) redirect('/login');

  const shops = await getShops().then((r) => r.data).catch(() => []);

  return (
    <div className="p-6">
      <ShopsAdminClient initialShops={shops} />
    </div>
  );
}
