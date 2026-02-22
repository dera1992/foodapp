import Link from 'next/link';
import { ArrowRight, Lock, ReceiptText, ShieldCheck, Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/money';

type CartSummaryCardProps = {
  subtotal: number;
  shipping: number;
  total: number;
  savings?: number;
};

export function CartSummaryCard({ subtotal, shipping, total, savings = 0 }: CartSummaryCardProps) {
  return (
    <section className="bf-cart-summary-card">
      <h2>
        <ReceiptText className="h-5 w-5 text-brand-primaryDark" />
        Cart Summary
      </h2>
      <div className="bf-summary-row">
        <span>Sub Total</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
      <div className="bf-summary-row">
        <span>Shipping Cost</span>
        <strong className={shipping <= 0 ? 'text-brand-primaryDark' : ''}>{shipping <= 0 ? 'Free' : formatCurrency(shipping)}</strong>
      </div>
      <div className="bf-grand-total-row">
        <span>Grand Total</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
      {savings > 0 ? <p className="bf-savings-callout">You are saving {formatCurrency(savings)} on this order.</p> : null}
      <div className="bf-summary-actions">
        <Link href="/checkout" className="bf-checkout-btn inline-flex items-center justify-center gap-2">
          CHECKOUT <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/shops" className="bf-continue-btn">
          Continue Shopping
        </Link>
      </div>
      <div className="bf-trust-row">
        <span><Lock className="h-3.5 w-3.5" /> Secure checkout</span>
        <span><Truck className="h-3.5 w-3.5" /> Fast pickup</span>
        <span><ShieldCheck className="h-3.5 w-3.5" /> Verified sellers</span>
      </div>
    </section>
  );
}