import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ShopDetailClient } from '@/components/shops/ShopDetailClient';
import {
  getShop,
  getShopProducts,
  getShopReviews,
  getSimilarShops,
  getThreads,
} from '@/lib/api/endpoints';
import { getSession } from '@/lib/auth/session';

export default async function ShopDetailsPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;

  const [shop, productsResult, reviews, similarShops, session] =
    await Promise.all([
      getShop(shopId).catch(() => null),
      getShopProducts(shopId).catch(() => ({ data: [] })),
      getShopReviews(shopId).catch(() => []),
      getSimilarShops(shopId).catch(() => []),
      getSession(),
    ]);

  if (!shop) return notFound();

  const products = productsResult.data;
  const isOwner = session.isAuthenticated && session.role === 'shop';
  const ownerUnreadMessages = isOwner
    ? await getThreads()
        .then((result) =>
          result.data.reduce((sum, thread) => sum + (thread.unreadCount ?? 0), 0),
        )
        .catch(() => 0)
    : 0;

  return (
    <>
      <div style={{ padding: '12px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shops', href: '/shops' },
            { label: shop.name },
          ]}
        />
      </div>
      <ShopDetailClient
        shop={shop}
        products={products}
        reviews={reviews}
        similarShops={similarShops}
        isOwner={isOwner}
        isAuthenticated={session.isAuthenticated}
        ownerUnreadMessages={ownerUnreadMessages}
      />
    </>
  );
}
