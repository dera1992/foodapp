import { Container } from '@/components/layout/Container';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getWishlist } from '@/lib/api/endpoints';

export default async function WishlistPage() {
  const items = await getWishlist().then((r) => r.data).catch(() => []);
  return (
    <>
      <section className="bg-white py-14">
        <Container>
          <h1 className="text-3xl font-bold tracking-tight text-brand-text md:text-4xl">Wishlist</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">Keep an eye on deals you love.</p>
        </Container>
      </section>
      <Container className="py-10">
        <Card className="bg-white p-5 sm:p-6">
          {items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          ) : (
            <EmptyState title="No saved items" description="Save products to compare and buy later." actionLabel="Browse products" actionHref="/shops" />
          )}
        </Card>
      </Container>
    </>
  );
}
