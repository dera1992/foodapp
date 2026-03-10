'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/api';
import { addToCart } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { getProductPath } from '@/lib/products';

function getFallbackEmoji(category?: unknown): string {
  const cat = String(category ?? '').toLowerCase();
  if (cat.includes('veg')) return '🥦';
  if (cat.includes('fruit')) return '🍎';
  if (cat.includes('fish') || cat.includes('seafood')) return '🐟';
  if (cat.includes('meat') || cat.includes('chicken')) return '🥩';
  if (cat.includes('grain') || cat.includes('rice')) return '🌾';
  return '🛒';
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const productName = typeof product.name === 'string' && product.name.trim() ? product.name : 'Product';
  const productDescription = (product.shortDescription || product.description || 'Fresh product from a local shop.').trim();
  const category = product.category || product.categories?.[0] || '';
  const price = typeof product.price === 'number' ? product.price : Number(product.price) || 0;
  const oldPrice =
    typeof product.oldPrice === 'number'
      ? product.oldPrice
      : product.oldPrice != null
        ? Number(product.oldPrice) || null
        : null;
  const fallbackEmoji = getFallbackEmoji(category);
  const productId = String(product.id ?? '');
  const productPath = getProductPath(product);

  const onAddToCart = () => {
    startTransition(async () => {
      try {
        await addToCart(productId, 1);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:refresh'));
        setNotice('Added to cart');
        window.setTimeout(() => setNotice(null), 1800);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push('/login?next=%2Fwishlist');
          return;
        }
        setNotice('Could not add to cart');
        window.setTimeout(() => setNotice(null), 2200);
      }
    });
  };

  return (
    <article className="product-card">
      <Link href={productPath} className="product-img" aria-label={`View ${productName}`}>
        {product.image ? <img src={product.image} alt={productName} /> : <span>{fallbackEmoji}</span>}
        <span className="wishlist-card-heart" aria-hidden="true">
          <Heart size={15} />
        </span>
      </Link>
      <div className="product-body">
        <Link href={productPath} className="product-name" style={{ display: 'block', textDecoration: 'none' }}>
          {productName}
        </Link>
        <p className="product-desc">{productDescription}</p>
        <div className="product-footer">
          <div className="prices">
            <span className="p-new">£{price.toFixed(2)}</span>
            {oldPrice ? <span className="p-old">£{oldPrice.toFixed(2)}</span> : null}
          </div>
          <button type="button" className="add-btn" onClick={onAddToCart} disabled={isPending} aria-label={`Add ${productName} to cart`}>
            <ShoppingCart size={16} />
          </button>
        </div>
        {notice ? <p className="product-weight" style={{ marginTop: 8 }}>{notice}</p> : null}
      </div>
    </article>
  );
}
