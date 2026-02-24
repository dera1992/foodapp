'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, MessageSquare } from 'lucide-react';
import type { Product, Shop, ShopReview } from '@/types/api';

type Tab = 'products' | 'reviews' | 'about';

type Props = {
  shop: Shop;
  products: Product[];
  reviews: ShopReview[];
  similarShops: Shop[];
  isOwner: boolean;
};

function formatMemberSince(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const now = new Date();
    const months =
      (now.getFullYear() - date.getFullYear()) * 12 +
      (now.getMonth() - date.getMonth());
    if (months < 24) return `${Math.max(1, months)} mo`;
    return `${Math.floor(months / 12)}yr`;
  }
  return value;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="shd-rev-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>
          ★
        </span>
      ))}
    </span>
  );
}

function ProductsTab({
  products,
  shopId,
  shopName,
  isOwner,
}: {
  products: Product[];
  shopId: string;
  shopName: string;
  isOwner: boolean;
}) {
  function savings(p: Product) {
    if (!p.oldPrice || p.oldPrice <= p.price) return 0;
    return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
  }

  function expiryDays(p: Product) {
    if (!p.expiresOn) return null;
    const diff = new Date(p.expiresOn).getTime() - Date.now();
    if (Number.isNaN(diff)) return null;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  if (!products.length) {
    return (
      <div className="shd-empty-products">
        <div className="shd-ep-icon">📭</div>
        <div className="shd-ep-title">No products listed yet</div>
        <div className="shd-ep-sub">
          {isOwner
            ? 'Add your first near-expiry product and start selling to local customers today.'
            : "This shop hasn't listed any products yet. Check back soon!"}
        </div>
        {isOwner && (
          <Link href="/account/shop/products/add" className="shd-btn-ep-add">
            <Plus size={14} /> List your first product
          </Link>
        )}
      </div>
    );
  }

  const emojis = ['🥦', '🥕', '🍅', '🥬', '🍎', '🧀', '🥛', '🌾'];

  return (
    <>
      <div className="shd-products-header">
        <h2>
          Products from <em>{shopName}</em>
        </h2>
        {isOwner && (
          <Link href="/account/shop/products/add" className="shd-btn-add-section">
            <Plus size={15} /> Add new product
          </Link>
        )}
      </div>
      <div className="shd-prod-grid">
        {products.map((p, i) => {
          const pct = savings(p);
          const exp = expiryDays(p);
          return (
            <Link href={`/shops/${shopId}/products/${p.id}`} key={p.id} className="shd-prod-card">
              <div className="shd-pc-thumb">
                <span style={{ fontSize: '2rem' }}>{emojis[i % emojis.length]}</span>
                <div className="shd-pc-badges">
                  {exp != null && exp <= 1 && <span className="shd-badge red">Exp today</span>}
                  {exp != null && exp > 1 && exp <= 2 && (
                    <span className="shd-badge red">Exp {exp} days</span>
                  )}
                  {exp != null && exp > 2 && exp <= 5 && (
                    <span className="shd-badge amber">Exp {exp} days</span>
                  )}
                  {pct > 0 && <span className="shd-badge amber">{pct}% OFF</span>}
                  {exp != null && exp > 5 && pct === 0 && (
                    <span className="shd-badge grn">Fresh</span>
                  )}
                </div>
              </div>
              <div className="shd-pc-body">
                <div className="shd-pc-name">{p.name}</div>
                {p.shortDescription && <div className="shd-pc-desc">{p.shortDescription}</div>}
                <div className="shd-pc-pr">
                  <span className="shd-pc-now">£{p.price.toFixed(2)}</span>
                  {p.oldPrice && p.oldPrice > p.price && (
                    <span className="shd-pc-was">£{p.oldPrice.toFixed(2)}</span>
                  )}
                  <button
                    className="shd-pc-add"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Plus size={13} color="white" />
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function ReviewsTab({ reviews }: { reviews: ShopReview[] }) {
  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  if (!reviews.length) {
    return (
      <div className="shd-no-reviews">No reviews yet. Be the first to review this shop!</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reviews.map((r) => (
        <div key={r.id} className="shd-review-card">
          <div className="shd-rev-header">
            <div className="shd-rev-avatar">{r.author.charAt(0).toUpperCase()}</div>
            <div>
              <div className="shd-rev-name">{r.author}</div>
              <div className="shd-rev-date">{formatDate(r.createdAt)}</div>
            </div>
            <StarRow rating={r.rating} />
          </div>
          <div className="shd-rev-text">{r.body}</div>
        </div>
      ))}
    </div>
  );
}

function AboutTab({ shop }: { shop: Shop }) {
  const rows: { icon: string; label: string; value: string | undefined }[] = [
    {
      icon: '📍',
      label: 'Address',
      value: [shop.address, shop.city].filter(Boolean).join(', ') || undefined,
    },
    { icon: '🕐', label: 'Opening hours', value: shop.openingHours },
    { icon: '📞', label: 'Phone', value: shop.phone },
    { icon: '✉️', label: 'Email', value: shop.email },
    { icon: '🏷️', label: 'Categories', value: shop.categories?.join(' · ') },
    { icon: '📅', label: 'Member since', value: shop.memberSince },
  ];

  return (
    <div className="shd-about-card">
      {rows
        .filter((r) => r.value)
        .map((r) => (
          <div key={r.label} className="shd-about-row">
            <div className="shd-about-icon">{r.icon}</div>
            <div>
              <div className="shd-about-label">{r.label}</div>
              <div className="shd-about-val">{r.value}</div>
            </div>
          </div>
        ))}
    </div>
  );
}

export function ShopDetailClient({
  shop,
  products,
  reviews,
  similarShops,
  isOwner,
}: Props) {
  const [tab, setTab] = useState<Tab>('products');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  async function handleSubscribe() {
    if (subscribed || subscribing) return;
    setSubscribing(true);
    try {
      await fetch(`/api/account/shops/${shop.id}/subscribe/`, { method: 'POST' });
      setSubscribed(true);
    } catch {
      // silently fail
    } finally {
      setSubscribing(false);
    }
  }

  const avgRating =
    reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : shop.rating ?? null;

  return (
    <div className="shd-page">
      <div className="shd-main">

        {/* ── Hero card ── */}
        <div className="shd-hero">

          {/* Cover banner */}
          <div className="shd-cover">
            <div className="shd-cover-deco" />
            {isOwner && (
              <div className="shd-owner-banner">
                <div className="shd-owner-txt">
                  <strong>You own this shop</strong>
                  Keep your listings fresh
                </div>
                <Link href="/account/shop/products/add" className="shd-btn-add-cover">
                  <Plus size={13} /> Add Product
                </Link>
              </div>
            )}
          </div>

          {/* Hero body */}
          <div className="shd-hero-body">
            <div className="shd-avatar">
              {shop.image ? (
                <img
                  src={shop.image}
                  alt={shop.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                shop.emoji || '🛒'
              )}
            </div>

            <div className="shd-name">{shop.name}</div>
            {(shop.address || shop.city) && (
              <div className="shd-addr">
                <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
                {[shop.address, shop.city].filter(Boolean).join(', ')}
              </div>
            )}
            {shop.description && <div className="shd-desc">{shop.description}</div>}

            {/* Actions row */}
            <div className="shd-actions">
              {shop.isOpen != null && (
                <span className={shop.isOpen ? 'shd-open-pill' : 'shd-closed-pill'}>
                  <span className="shd-status-dot" />
                  {shop.isOpen ? 'Open now' : 'Closed'}
                </span>
              )}
              <button
                className="shd-btn-subscribe"
                onClick={handleSubscribe}
                disabled={subscribed || subscribing}
                type="button"
              >
                {subscribed ? '✓ Subscribed' : subscribing ? 'Subscribing…' : '+ Subscribe'}
              </button>
              <Link href={`/messages?shop=${shop.id}`} className="shd-btn-chat">
                <MessageSquare size={14} /> Chat with shop
              </Link>
              {isOwner && (
                <Link href="/account/shop/products/add" className="shd-btn-add-actions">
                  <Plus size={14} /> Add Product
                </Link>
              )}
            </div>
          </div>

          {/* Stats bar — always 4 slots */}
          <div className="shd-stats-bar">
            <div className="shd-stat">
              <span className="shd-stat-n">{products.length || shop.productsCount || 0}</span>
              <span className="shd-stat-l">Products</span>
            </div>
            <div className="shd-stat">
              <span className="shd-stat-n accent">
                {avgRating != null ? avgRating.toFixed(1) : '—'}
              </span>
              <span className="shd-stat-l">Rating</span>
            </div>
            <div className="shd-stat">
              <span className="shd-stat-n">{shop.subscriberCount ?? '—'}</span>
              <span className="shd-stat-l">Subscribers</span>
            </div>
            <div className="shd-stat">
              <span className="shd-stat-n">{formatMemberSince(shop.memberSince)}</span>
              <span className="shd-stat-l">On bunchfood</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="shd-tabs">
          <button
            className={`shd-tab ${tab === 'products' ? 'active' : ''}`}
            onClick={() => setTab('products')}
            type="button"
          >
            📦 Products
          </button>
          <button
            className={`shd-tab ${tab === 'reviews' ? 'active' : ''}`}
            onClick={() => setTab('reviews')}
            type="button"
          >
            ⭐ Reviews ({reviews.length})
          </button>
          <button
            className={`shd-tab ${tab === 'about' ? 'active' : ''}`}
            onClick={() => setTab('about')}
            type="button"
          >
            ℹ️ About
          </button>
        </div>

        {/* Tab content */}
        {tab === 'products' && (
          <ProductsTab
            products={products}
            shopId={shop.id}
            shopName={shop.name}
            isOwner={isOwner}
          />
        )}
        {tab === 'reviews' && <ReviewsTab reviews={reviews} />}
        {tab === 'about' && <AboutTab shop={shop} />}
      </div>

      {/* ── Sidebar ── */}
      <div className="shd-sidebar">

        {/* Add Product card — owner only */}
        {isOwner && (
          <div className="shd-add-card">
            <div className="shd-apc-icon">🏪</div>
            <div className="shd-apc-title">Manage your shop</div>
            <div className="shd-apc-sub">
              List new near-expiry items and reach local buyers before stock goes to waste.
            </div>
            <Link href="/account/shop/products/add" className="shd-btn-apc">
              <Plus size={15} /> Add Product
            </Link>
          </div>
        )}

        {/* Chat card — customer only */}
        {!isOwner && (
          <div className="shd-chat-card">
            <div className="shd-cc-title">Chat with {shop.name}</div>
            <div className="shd-cc-sub">
              Ask about stock, pickup times, or product details. Usually replies within 1 hour.
            </div>
            <Link href={`/messages?shop=${shop.id}`} className="shd-btn-open-chat">
              <MessageSquare size={14} /> Open chat inbox
            </Link>
          </div>
        )}

        {/* Subscribe card — customer only */}
        {!isOwner && (
          <div className="shd-sub-card">
            <div className="shd-sub-icon">🔔</div>
            <div className="shd-sub-title">Stay updated</div>
            <div className="shd-sub-sub">
              Subscribe to get notified when {shop.name} adds new deals.
            </div>
            <button
              className="shd-btn-sub"
              onClick={handleSubscribe}
              disabled={subscribed || subscribing}
              type="button"
            >
              {subscribed ? '✓ Subscribed' : '+ Subscribe'}
            </button>
          </div>
        )}

        {/* Similar shops */}
        {similarShops.length > 0 && (
          <div className="shd-similar-card">
            <div className="shd-sc-title">Similar shops</div>
            {similarShops.slice(0, 4).map((s) => (
              <Link key={s.id} href={`/shops/${s.id}`} className="shd-sc-item">
                <div className="shd-sc-av">{s.emoji || '🛒'}</div>
                <div>
                  <div className="shd-sc-name">{s.name}</div>
                  <div className="shd-sc-meta">
                    {s.city || s.address || ''}
                    {s.rating != null ? ` · ★ ${s.rating.toFixed(1)}` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
