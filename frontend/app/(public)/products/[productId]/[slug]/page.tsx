import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';
import { getProduct, getProducts, getShop, getShopProducts } from '@/lib/api/endpoints';
import { getSession } from '@/lib/auth/session';
import type { Product } from '@/types/api';
import { filterVisibleProducts, getProductPath, isProductExpired, slugifyProductSegment } from '@/lib/products';

async function loadProduct(productId: string): Promise<Product | null> {
  let product = await getProduct(productId).catch(() => null);
  if (!product) {
    product = await getProducts()
      .then((response) => response.data.find((item) => String(item.id) === String(productId)) ?? null)
      .catch(() => null);
  }
  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string; slug: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await loadProduct(productId);

  if (!product) {
    return {
      title: 'Product not found - Bunchfood',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bunchfood.com';
  const canonicalPath = getProductPath(product);
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const description =
    product.shortDescription ||
    product.description ||
    `Buy ${product.name} from ${product.shopName || 'a local shop'} on Bunchfood.`;

  return {
    title: `${product.name} - Bunchfood`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: product.name,
      description,
      url: canonicalUrl,
      siteName: 'Bunchfood',
      type: 'website',
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
    twitter: {
      card: product.image ? 'summary_large_image' : 'summary',
      title: product.name,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string; slug: string }>;
}) {
  const { productId, slug } = await params;
  const product = await loadProduct(productId);
  if (!product) return notFound();
  const session = await getSession();
  if (session.role !== 'shop' && isProductExpired(product)) return notFound();

  const canonicalPath = getProductPath(product);
  const canonicalSlug = canonicalPath.split('/').pop() ?? '';
  if (canonicalSlug && slugifyProductSegment(slug) !== canonicalSlug) {
    permanentRedirect(canonicalPath);
  }

  const related = await getProducts()
    .then((response) => {
      const visibleProducts = session.role === 'shop' ? response.data : filterVisibleProducts(response.data);
      const sameCategory = visibleProducts.filter(
        (item) => item.id !== product.id && (item.category || '') === (product.category || '')
      );
      const fallback = visibleProducts.filter((item) => item.id !== product.id);
      return (sameCategory.length ? sameCategory : fallback).slice(0, 4);
    })
    .catch(() => []);

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
          products: shopProductsResult.data.map((item) => ({ id: item.id, name: item.name })),
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
