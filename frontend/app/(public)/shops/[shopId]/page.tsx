import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { PageHero } from '@/components/layout/PageHero';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getProducts, getShop } from '@/lib/api/endpoints';

export default async function ShopDetailsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const shop = await getShop(shopId).catch(() => null);
  if (!shop) return notFound();

  const products = await getProducts().then((r) => r.data.filter((p) => p.shopId === shopId)).catch(() => []);

  return (
    <>
      <PageHero title={shop.name} subtitle={`${shop.address || 'Address unavailable'}${shop.city ? `, ${shop.city}` : ''}`} />
      <Container className="py-10">
        {products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <EmptyState title="No products yet" description="This shop has not published products right now." />
        )}
      </Container>
    </>
  );
}