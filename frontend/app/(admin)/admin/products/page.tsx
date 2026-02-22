import Link from 'next/link';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getAdminProducts } from '@/lib/api/endpoints';

export default async function AdminProductsPage() {
  const products = await getAdminProducts().then((r) => r.data).catch(() => []);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new"><Button>Add product</Button></Link>
      </div>
      {products.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      ) : (
        <EmptyState title="No products" description="Create your first product listing." actionLabel="Add product" actionHref="/admin/products/new" />
      )}
    </div>
  );
}