import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';
import { getProduct, getProducts, getShop, getShopProducts } from '@/lib/api/endpoints';
import { getSession } from '@/lib/auth/session';

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

  const session = await getSession();
  let shop: Awaited<ReturnType<typeof getShop>> | null = null;
  let shopProductsResult: { data: Array<{ id: string; name: string }> } = { data: [] };

  if (product.shopId) {
    [shop, shopProductsResult] = await Promise.all([
      getShop(product.shopId).catch(() => null),
      getShopProducts(product.shopId).catch(() => ({ data: [] as Array<{ id: string; name: string }> })),
    ]);
  }

  const chat =
    product.shopId && shop
      ? {
          shopId: product.shopId,
          shopName: shop.name || product.shopName || 'Shop',
          receiverUserId: shop.ownerUserId,
          products: shopProductsResult.data.map((item) => ({ id: item.id, name: item.name }))
        }
      : null;

  const canSubscribeToShop =
    !(session.isAuthenticated && session.role === 'shop' && shop?.ownerUserId && session.userId === shop.ownerUserId);

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
      <ProductDetailView
        product={product}
        related={related}
        chat={chat}
        isAuthenticated={session.isAuthenticated}
        canSubscribeToShop={canSubscribeToShop}
      />
    </>
  );
}
