import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';
import { getProduct, getProducts } from '@/lib/api/endpoints';

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getProduct(productId).catch(() => null);
  if (!product) return notFound();

  const related = await getProducts()
    .then((response) => {
      const sameCategory = response.data.filter(
        (item) => item.id !== product.id && (item.category || '') === (product.category || '')
      );
      const fallback = response.data.filter((item) => item.id !== product.id);
      return (sameCategory.length ? sameCategory : fallback).slice(0, 4);
    })
    .catch(() => []);

  return (
    <>
      <div className="pd-breadcrumb-wrap">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: product.name },
          ]}
        />
      </div>
      <ProductDetailView product={product} related={related} />
    </>
  );
}
