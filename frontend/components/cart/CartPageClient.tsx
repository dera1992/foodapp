'use client';

import { FormEvent, useMemo, useState, useTransition } from 'react';
import type { BudgetSummary, Cart, OrderSummary } from '@/types/api';
import { applyCoupon, getCart, removeCartItem, updateCartItem } from '@/lib/api/endpoints';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CartTable } from '@/components/cart/CartTable';
import { CartSummaryCard } from '@/components/cart/CartSummaryCard';
import { BudgetPlannerCard } from '@/components/cart/BudgetPlannerCard';

type CartPageClientProps = {
  initialCart: Cart;
  orderSummary: OrderSummary | null;
  budget: BudgetSummary | null;
};

export function CartPageClient({ initialCart, orderSummary, budget }: CartPageClientProps) {
  const [cart, setCart] = useState(initialCart);
  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemCount = cart.count || cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const budgetTotal = budget?.monthlyLimit ?? 0;
  const plannedSpend = cart.total || orderSummary?.total || 0;
  const remaining = budget ? budget.remaining : budgetTotal - plannedSpend;

  const onSync = () => {
    startTransition(async () => {
      const next = await getCart().catch(() => cart);
      setCart(next);
    });
  };

  const onQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, quantity, lineTotal: quantity * item.unitPrice } : item
      )
    }));

    startTransition(async () => {
      try {
        const next = await updateCartItem(productId, quantity);
        setCart(next);
      } catch {
        onSync();
      }
    });
  };

  const onRemove = (productId: string) => {
    setCart((prev) => ({ ...prev, items: prev.items.filter((item) => item.productId !== productId) }));
    startTransition(async () => {
      try {
        const next = await removeCartItem(productId);
        setCart(next);
      } catch {
        onSync();
      }
    });
  };

  const onApplyCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!couponCode.trim()) return;
    setCouponFeedback(null);

    startTransition(async () => {
      try {
        const next = await applyCoupon(couponCode.trim());
        setCart(next);
        setCouponFeedback('Coupon applied successfully.');
      } catch {
        setCouponFeedback('Coupon is invalid or unavailable.');
      }
    });
  };

  const totals = useMemo(
    () => ({
      subtotal: cart.subtotal || cart.items.reduce((sum, item) => sum + item.lineTotal, 0),
      shipping: cart.shipping || 0,
      total: cart.total || cart.items.reduce((sum, item) => sum + item.lineTotal, 0),
      savings: cart.savings || cart.items.reduce((sum, item) => sum + (item.savings || 0), 0)
    }),
    [cart]
  );

  return (
    <>
      <section className="bf-cart-head-wrap">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
        <div className="px-[5%] pb-8">
          <h1>
            Your <em>Cart</em>
          </h1>
          <p>
            {itemCount} item{itemCount === 1 ? '' : 's'} in your basket.
          </p>
        </div>
      </section>

      <section className="bf-cart-layout">
        <div>
          <CartTable items={cart.items} onQuantityChange={onQuantityChange} onRemove={onRemove} loading={isPending} />
          {cart.items.length > 0 ? (
            <section className="bf-coupon-card">
              <h3>Discount Coupon Code</h3>
              <form className="bf-coupon-row" onSubmit={onApplyCoupon}>
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Enter coupon code..."
                  aria-label="Coupon code"
                />
                <button type="submit" disabled={isPending}>
                  Apply Coupon
                </button>
              </form>
              {couponFeedback ? <p className="mt-3 text-sm text-brand-muted">{couponFeedback}</p> : null}
            </section>
          ) : null}
        </div>
        <aside className="bf-cart-side">
          <CartSummaryCard subtotal={totals.subtotal} shipping={totals.shipping} total={totals.total} savings={totals.savings} />
          <BudgetPlannerCard totalBudget={budgetTotal} plannedSpend={plannedSpend} remaining={remaining} />
        </aside>
      </section>
    </>
  );
}