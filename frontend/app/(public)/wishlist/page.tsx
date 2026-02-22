import { Container } from '@/components/layout/Container';
import { PageHero } from '@/components/layout/PageHero';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getWishlist } from '@/lib/api/endpoints';

export default async function WishlistPage() {
  const items = await getWishlist().then((r) => r.data).catch(() => []);
  return (
    <>
      <PageHero title="Wishlist" subtitle="Keep an eye on deals you love." />
      <Container className="py-10">
        {items.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <EmptyState title="No saved items" description="Save products to compare and buy later." actionLabel="Browse products" actionHref="/shops" />
        )}
      </Container>
    </>
  );
}