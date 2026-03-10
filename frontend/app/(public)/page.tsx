import { LandingHome } from '@/components/landing/LandingHome';
import { getProducts, getShops } from '@/lib/api/endpoints';
import { getSession } from '@/lib/auth/session';
import { filterVisibleProducts } from '@/lib/products';

export default async function HomePage() {
  const [shopsResult, productsResult, sessionResult] = await Promise.allSettled([getShops(), getProducts(), getSession()]);
  const shops = shopsResult.status === 'fulfilled' ? (shopsResult.value.data ?? []) : [];
  const products = productsResult.status === 'fulfilled' ? filterVisibleProducts(productsResult.value.data ?? []) : [];
  const session = sessionResult.status === 'fulfilled' ? sessionResult.value : { isAuthenticated: false as const };

  return <LandingHome shops={shops} products={products} session={session} />;
}
