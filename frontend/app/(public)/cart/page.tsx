import type { BudgetSummary, Cart, OrderSummary } from '@/types/api';
import { CartPageClient } from '@/components/cart/CartPageClient';
import { getBudget, getCart, getCartOrderSummary } from '@/lib/api/endpoints';

const emptyCart: Cart = {
  items: [],
  count: 0,
  subtotal: 0,
  shipping: 0,
  savings: 0,
  total: 0
};

export default async function CartPage() {
  const [cartResult, summaryResult, budgetResult] = await Promise.allSettled([getCart(), getCartOrderSummary(), getBudget()]);
  const initialCart: Cart = cartResult.status === 'fulfilled' ? cartResult.value : emptyCart;
  const orderSummary: OrderSummary | null = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const budget: BudgetSummary | null = budgetResult.status === 'fulfilled' ? budgetResult.value : null;

  return <CartPageClient initialCart={initialCart} orderSummary={orderSummary} budget={budget} />;
}
