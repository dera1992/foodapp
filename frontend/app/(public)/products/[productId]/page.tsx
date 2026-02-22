import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { getProduct, getProducts } from '@/lib/api/endpoints';

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getProduct(productId).catch(() => null);
  if (!product) return notFound();

  const related = await getProducts()
    .then((response) => {
      const sameCategory = response.data.filter((item) => item.id !== product.id && (item.category || '') === (product.category || ''));
      const fallback = response.data.filter((item) => item.id !== product.id);
      return (sameCategory.length ? sameCategory : fallback).slice(0, 4);
    })
    .catch(() => []);

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: product.category || 'Products', href: '/shops' },
          { label: product.name }
        ]}
      />
      <Container className="pb-14">
        <ProductDetailView product={product} related={related} />
      </Container>
    </>
  );
}
