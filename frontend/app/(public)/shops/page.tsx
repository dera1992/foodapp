import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ShopsDirectoryClient } from '@/components/shops/ShopsDirectoryClient';
import { getShops } from '@/lib/api/endpoints';
import { getSession } from '@/lib/auth/session';

export const metadata = { title: 'Browse Shops — BunchFood' };

export default async function ShopsPage() {
  const [shops, session] = await Promise.all([
    getShops().then((r) => r.data).catch(() => []),
    getSession(),
  ]);

  return (
    <>
      <div style={{ padding: '12px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shops' }]} />
      </div>
      <ShopsDirectoryClient shops={shops} isAuthenticated={session.isAuthenticated} currentUserId={session.userId} />
    </>
  );
}
