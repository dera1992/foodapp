'use client';

import { useMemo, useState, useTransition } from 'react';
import type { BudgetSummary, Cart, OrderSummary } from '@/types/api';
import { addToCart, clearCart, getCart, removeCartItem, removeSingleCartItem, updateCartItem } from '@/lib/api/endpoints';
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
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemCount = useMemo(
    () => new Set(cart.items.map((item) => String(item.productId))).size,
    [cart.items]
  );
  const budgetTotal = budget?.monthlyLimit ?? 0;

  const onSync = () => {
    startTransition(async () => {
      const next = await getCart().catch(() => cart);
      setCart(next);
    });
  };

  const onQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    const currentItem = cart.items.find((item) => item.productId === productId);
    const previousQty = currentItem?.quantity ?? 1;
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, quantity, lineTotal: quantity * item.unitPrice } : item
      )
    }));

    startTransition(async () => {
      try {
        const next =
          quantity === previousQty + 1
            ? await addToCart(productId, 1)
            : quantity === previousQty - 1
              ? await removeSingleCartItem(productId)
              : await updateCartItem(productId, quantity);
        setCart(next);
        setCartNotice(null);
      } catch {
        setCartNotice('Could not update cart item.');
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
        setCartNotice(null);
      } catch {
        setCartNotice('Could not remove item.');
        onSync();
      }
    });
  };

  const onClearCart = () => {
    if (!cart.items.length) return;
    setCart({ ...cart, items: [], count: 0, subtotal: 0, total: 0, savings: 0 });
    startTransition(async () => {
      try {
        const next = await clearCart();
        setCart(next);
        setCartNotice('Cart cleared.');
      } catch {
        setCartNotice('Could not clear cart.');
        onSync();
      }
    });
  };

  const totals = useMemo(() => {
    const subtotal = cart.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = cart.shipping || 0;
    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
      savings: cart.items.reduce((sum, item) => sum + (item.savings || 0), 0)
    };
  }, [cart.items, cart.shipping]);
  const plannedSpend = totals.total;
  const remaining = budgetTotal - plannedSpend;

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
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white p-4">
              <p className="text-sm text-brand-muted">Manage all items in your basket.</p>
              <button type="button" className="bf-budget-btn is-amber is-sm" onClick={onClearCart} disabled={isPending}>
                Clear cart
              </button>
            </div>
          ) : null}
          {cartNotice ? (
            <p className="mt-3 text-sm text-brand-muted">{cartNotice}</p>
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
