import { LandingHome } from '@/components/landing/LandingHome';
import { getProducts, getShops } from '@/lib/api/endpoints';

export default async function HomePage() {
  const [shopsResult, productsResult] = await Promise.allSettled([getShops(), getProducts()]);
  const shops = shopsResult.status === 'fulfilled' ? (shopsResult.value.data ?? []) : [];
  const products = productsResult.status === 'fulfilled' ? (productsResult.value.data ?? []) : [];

  return <LandingHome shops={shops} products={products} />;
}