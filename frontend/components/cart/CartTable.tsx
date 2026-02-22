'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Trash2 } from 'lucide-react';
import type { CartItem } from '@/types/api';
import { formatCurrency } from '@/lib/utils/money';
import { QuantityControl } from '@/components/marketplace/QuantityControl';
import { EmptyState } from '@/components/ui/EmptyState';

type CartTableProps = {
  items: CartItem[];
  loading?: boolean;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};

export function CartTable({ items, loading = false, onQuantityChange, onRemove }: CartTableProps) {
  if (!items.length) {
    return (
      <div className="bf-cart-table-card">
        <EmptyState
          title="Your cart is empty"
          description="Browse our deals and add some items."
          actionLabel="Browse Deals"
          actionHref="/shops"
          icon={<ShoppingCart className="h-12 w-12 text-brand-primary" />}
        />
      </div>
    );
  }

  return (
    <section className="bf-cart-table-card">
      <div className="bf-cart-head-row">
        <span>Image</span>
        <span>Product</span>
        <span>Price</span>
        <span>Quantity</span>
        <span>Total</span>
        <span>Remove</span>
      </div>
      <div>
        {items.map((item) => (
          <article key={item.productId} className="bf-cart-item-row">
            <div className="bf-cart-image-wrap">
              <Image src={item.image || '/placeholder-product.svg'} alt={item.name} width={80} height={80} className="bf-cart-image" />
            </div>
            <div>
              <h3>{item.name}</h3>
              <p>{item.shopName || 'Local shop'}</p>
              <Link href={`/products/${item.productId}`} className="bf-cart-mobile-link">
                View product
              </Link>
            </div>
            <p className="bf-cart-price">{formatCurrency(item.unitPrice)}</p>
            <div>
              <QuantityControl compact value={item.quantity} onChange={(next) => onQuantityChange(item.productId, next)} />
            </div>
            <div>
              <p className="bf-cart-line-total">{formatCurrency(item.lineTotal)}</p>
              {item.savings && item.savings > 0 ? <span className="bf-cart-saving-pill">Saving {formatCurrency(item.savings)}</span> : null}
            </div>
            <div>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                className="bf-cart-remove-btn"
                onClick={() => onRemove(item.productId)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}