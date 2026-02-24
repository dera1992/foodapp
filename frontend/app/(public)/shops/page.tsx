import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ShopsDirectoryClient } from '@/components/shops/ShopsDirectoryClient';
import { getShops } from '@/lib/api/endpoints';

export const metadata = { title: 'Browse Shops — BunchFood' };

export default async function ShopsPage() {
  const shops = await getShops().then((r) => r.data).catch(() => []);

  return (
    <>
      <div style={{ padding: '12px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shops' }]} />
      </div>
      <ShopsDirectoryClient shops={shops} />
    </>
  );
}
