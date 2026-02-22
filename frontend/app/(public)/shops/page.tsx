import { Container } from '@/components/layout/Container';
import { PageHero } from '@/components/layout/PageHero';
import { ShopCard } from '@/components/marketplace/ShopCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getShops } from '@/lib/api/endpoints';

export default async function ShopsPage() {
  const shops = await getShops().then((r) => r.data).catch(() => []);
  return (
    <>
      <PageHero title="Shops" subtitle="Explore trusted local shops with near-expiry offers." />
      <Container className="py-10">
        {shops.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)}</div>
        ) : (
          <EmptyState title="No shops available" description="Try again later or adjust your location filters." />
        )}
      </Container>
    </>
  );
}