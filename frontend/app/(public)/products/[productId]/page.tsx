import { permanentRedirect } from 'next/navigation';
import { getProduct } from '@/lib/api/endpoints';
import { getProductPath } from '@/lib/products';

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getProduct(productId).catch(() => null);

  if (!product) {
    permanentRedirect('/products');
  }

  permanentRedirect(getProductPath(product));
}
