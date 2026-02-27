import { getShops } from '@/lib/api/endpoints';
import { ShopPortalLayout } from '@/components/shop-portal/ShopPortalLayout';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const shops = await getShops().then((r) => r.data).catch(() => []);
  const shop = shops[0] ?? null;

  const shopName = shop?.name ?? 'My Shop';
  const initials = shopName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ShopPortalLayout shopName={shopName} initials={initials}>
      {children}
    </ShopPortalLayout>
  );
}
