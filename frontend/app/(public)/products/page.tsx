import { Suspense } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductListClient } from '@/components/products/ProductListClient';
import { getProducts } from '@/lib/api/endpoints';
import { getSession } from '@/lib/auth/session';
import { filterVisibleProducts } from '@/lib/products';

export const metadata = { title: 'Browse Products — BunchFood' };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const [products, session] = await Promise.all([
    getProducts().then((r) => filterVisibleProducts(r.data)).catch(() => []),
    getSession(),
  ]);
  const params = await searchParams;
  const initialSelectedCategories = params?.category ? [params.category] : [];

  const categoriesSet = new Set<string>();
  for (const p of products) {
    if (p.categories?.length) {
      for (const c of p.categories) categoriesSet.add(c);
    } else if (p.category) {
      categoriesSet.add(p.category);
    }
  }
  const allCategories = Array.from(categoriesSet).sort();

  return (
    <>
      <div className="pl-breadcrumb-wrap">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Products' }]} />
      </div>
      <Suspense>
        <ProductListClient
          products={products}
          allCategories={allCategories}
          initialSelectedCategories={initialSelectedCategories}
          isAuthenticated={session.isAuthenticated}
        />
      </Suspense>
    </>
  );
}
