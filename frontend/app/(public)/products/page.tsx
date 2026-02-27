import { Suspense } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductListClient } from '@/components/products/ProductListClient';
import { getProducts } from '@/lib/api/endpoints';
import { getSession } from '@/lib/auth/session';

export const metadata = { title: 'Browse Products — BunchFood' };

export default async function ProductsPage() {
  const [products, session] = await Promise.all([
    getProducts().then((r) => r.data).catch(() => []),
    getSession(),
  ]);

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
          isAuthenticated={session.isAuthenticated}
        />
      </Suspense>
    </>
  );
}
