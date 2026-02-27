import { redirect } from 'next/navigation';
import { CheckoutPageClient } from '@/components/checkout/CheckoutPageClient';
import { getSession } from '@/lib/auth/session';
import { getCart, getCheckoutTimeSlots, getSavedAddresses } from '@/lib/api/endpoints';
import type { Cart } from '@/types/api';

const emptyCart: Cart = {
  items: [],
  count: 0,
  subtotal: 0,
  shipping: 0,
  savings: 0,
  total: 0
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCartWithRetry(maxAttempts = 5, delayMs = 250): Promise<Cart> {
  let latest: Cart = emptyCart;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    latest = await getCart().catch(() => latest);
    if (latest.items.length > 0) return latest;
    if (attempt < maxAttempts - 1) {
      await sleep(delayMs);
    }
  }
  return latest;
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CheckoutPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<SearchParams>).then === 'function'
      ? await (searchParams as Promise<SearchParams>)
      : ((searchParams as SearchParams | undefined) ?? {});
  const session = await getSession();
  if (!session.isAuthenticated) {
    redirect('/login?next=/checkout');
  }

  const fromBudgetRaw = resolvedSearchParams?.from;
  const fromBudget = (Array.isArray(fromBudgetRaw) ? fromBudgetRaw[0] : fromBudgetRaw) === 'budget';
  const cartAttempts = fromBudget ? 12 : 5;
  const cartDelayMs = fromBudget ? 300 : 250;

  const [cartResult, addressesResult, slotsResult] = await Promise.allSettled([
    getCartWithRetry(cartAttempts, cartDelayMs),
    getSavedAddresses(),
    getCheckoutTimeSlots(todayIso())
  ]);

  const cart = cartResult.status === 'fulfilled' ? cartResult.value : emptyCart;
  if (!cart.items.length) {
    redirect('/cart');
  }

  const savedAddresses = addressesResult.status === 'fulfilled' ? addressesResult.value : [];
  const timeSlots = slotsResult.status === 'fulfilled' ? slotsResult.value : [];

  return <CheckoutPageClient initialCart={cart} savedAddresses={savedAddresses} initialTimeSlots={timeSlots} />;
}
