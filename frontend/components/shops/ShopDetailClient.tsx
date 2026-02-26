'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Package,
  Star,
  Store,
  Tags,
} from 'lucide-react';
import { StartChatDialog } from '@/components/chat/StartChatDialog';
import type { Product, Shop, ShopReview } from '@/types/api';

type Tab = 'products' | 'reviews' | 'about';

type Props = {
  shop: Shop;
  products: Product[];
  reviews: ShopReview[];
  similarShops: Shop[];
  isOwner: boolean;
  isAuthenticated: boolean;
  ownerUnreadMessages?: number;
};

function formatMemberSince(value: string | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const months =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());
  if (months < 24) return `${Math.max(1, months)} mo`;
  return `${Math.floor(months / 12)}yr`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="shd-rev-stars" style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= Math.round(rating);
        return (
          <Star
            key={n}
            size={14}
            strokeWidth={1.8}
            style={{ color: active ? '#f59e0b' : '#d1d5db' }}
            fill={active ? '#f59e0b' : 'none'}
          />
        );
      })}
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
        <div className="shd-ep-icon">
          <Store size={20} />
        </div>
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

  const placeholders: ReactNode[] = [
    <Store key="s" size={22} />,
    <Package key="p" size={22} />,
    <Tags key="t" size={22} />,
    <Bell key="b" size={22} />,
    <Clock3 key="c" size={22} />,
    <MapPin key="m" size={22} />,
    <Star key="r" size={22} />,
    <Plus key="x" size={22} />,
  ];

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
            <Link href={`/products/${p.id}`} key={p.id} className="shd-prod-card">
              <div className="shd-pc-thumb">
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {placeholders[i % placeholders.length]}
                </span>
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
                  <span className="shd-pc-now">N{p.price.toFixed(2)}</span>
                  {p.oldPrice && p.oldPrice > p.price && (
                    <span className="shd-pc-was">N{p.oldPrice.toFixed(2)}</span>
                  )}
                  <button
                    className="shd-pc-add"
                    type="button"
                    onClick={(e) => e.preventDefault()}
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
    return <div className="shd-no-reviews">No reviews yet. Be the first to review this shop!</div>;
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
  const rows: { icon: ReactNode; label: string; value: string | undefined }[] = [
    {
      icon: <MapPin size={16} />,
      label: 'Address',
      value: [shop.address, shop.city].filter(Boolean).join(', ') || undefined,
    },
    { icon: <Clock3 size={16} />, label: 'Opening hours', value: shop.openingHours },
    { icon: <Phone size={16} />, label: 'Phone', value: shop.phone },
    { icon: <Mail size={16} />, label: 'Email', value: shop.email },
    { icon: <Tags size={16} />, label: 'Categories', value: shop.categories?.join(', ') },
    { icon: <Calendar size={16} />, label: 'Member since', value: shop.memberSince },
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
  isAuthenticated,
  ownerUnreadMessages = 0,
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
      // no-op
    } finally {
      setSubscribing(false);
    }
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : (shop.rating ?? null);

  return (
    <div className="shd-page">
      <div className="shd-main">
        <div className="shd-hero">
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

          <div className="shd-hero-body">
            <div className="shd-avatar">
              {shop.image ? (
                <img
                  src={shop.image}
                  alt={shop.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                shop.emoji || 'S'
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

            <div className="shd-actions">
              {shop.isOpen != null && (
                <span className={shop.isOpen ? 'shd-open-pill' : 'shd-closed-pill'}>
                  <span className="shd-status-dot" />
                  {shop.isOpen ? 'Open now' : 'Closed'}
                </span>
              )}
              {!isOwner ? (
                isAuthenticated ? (
                  <button
                    className="shd-btn-subscribe"
                    onClick={handleSubscribe}
                    disabled={subscribed || subscribing}
                    type="button"
                  >
                    {subscribed ? 'Subscribed' : subscribing ? 'Subscribing...' : '+ Subscribe'}
                  </button>
                ) : (
                  <Link href="/login" className="shd-btn-subscribe">
                    Login to subscribe
                  </Link>
                )
              ) : null}
              {!isOwner ? (
                isAuthenticated ? (
                  <StartChatDialog
                    shopId={shop.id}
                    receiverUserId={shop.ownerUserId}
                    shopName={shop.name}
                    products={products.map((p) => ({ id: p.id, name: p.name }))}
                    triggerLabel="Chat with shop"
                    triggerClassName="shd-btn-chat"
                  />
                ) : (
                  <Link href="/login" className="shd-btn-chat">
                    <MessageSquare size={14} /> Login to chat
                  </Link>
                )
              ) : (
                <Link href={`/messages?shop=${encodeURIComponent(shop.id)}&ownerInbox=1`} className="shd-btn-chat">
                  <MessageSquare size={14} />
                  {ownerUnreadMessages > 0
                    ? ` Messages (${ownerUnreadMessages} new)`
                    : ' Messages'}
                </Link>
              )}
              {isOwner && (
                <Link href="/account/shop/products/add" className="shd-btn-add-actions">
                  <Plus size={14} /> Add Product
                </Link>
              )}
            </div>
          </div>

          <div className="shd-stats-bar">
            <div className="shd-stat">
              <span className="shd-stat-n">{products.length || shop.productsCount || 0}</span>
              <span className="shd-stat-l">Products</span>
            </div>
            <div className="shd-stat">
              <span className="shd-stat-n accent">
                {avgRating != null ? avgRating.toFixed(1) : '-'}
              </span>
              <span className="shd-stat-l">Rating</span>
            </div>
            <div className="shd-stat">
              <span className="shd-stat-n">{shop.subscriberCount ?? '-'}</span>
              <span className="shd-stat-l">Subscribers</span>
            </div>
            <div className="shd-stat">
              <span className="shd-stat-n">{formatMemberSince(shop.memberSince)}</span>
              <span className="shd-stat-l">On bunchfood</span>
            </div>
          </div>
        </div>

        <div className="shd-tabs">
          <button
            className={`shd-tab ${tab === 'products' ? 'active' : ''}`}
            onClick={() => setTab('products')}
            type="button"
          >
            Products
          </button>
          <button
            className={`shd-tab ${tab === 'reviews' ? 'active' : ''}`}
            onClick={() => setTab('reviews')}
            type="button"
          >
            Reviews ({reviews.length})
          </button>
          <button
            className={`shd-tab ${tab === 'about' ? 'active' : ''}`}
            onClick={() => setTab('about')}
            type="button"
          >
            About
          </button>
        </div>

        {tab === 'products' && (
          <ProductsTab products={products} shopId={shop.id} shopName={shop.name} isOwner={isOwner} />
        )}
        {tab === 'reviews' && <ReviewsTab reviews={reviews} />}
        {tab === 'about' && <AboutTab shop={shop} />}
      </div>

      <div className="shd-sidebar">
        {isOwner && (
          <div className="shd-add-card">
            <div className="shd-apc-icon">
              <Store size={18} />
            </div>
            <div className="shd-apc-title">Manage your shop</div>
            <div className="shd-apc-sub">
              List new near-expiry items and reach local buyers before stock goes to waste.
            </div>
            <Link href="/account/shop/products/add" className="shd-btn-apc">
              <Plus size={15} /> Add Product
            </Link>
          </div>
        )}

        {!isOwner && (
          <div className="shd-chat-card">
            <div className="shd-cc-title">Chat with {shop.name}</div>
            <div className="shd-cc-sub">
              Ask about stock, pickup times, or product details. Usually replies within 1 hour.
            </div>
            {isAuthenticated ? (
              <StartChatDialog
                shopId={shop.id}
                receiverUserId={shop.ownerUserId}
                shopName={shop.name}
                products={products.map((p) => ({ id: p.id, name: p.name }))}
                triggerLabel="Start chat"
                triggerClassName="shd-btn-open-chat"
              />
            ) : (
              <Link href="/login" className="shd-btn-open-chat">
                Login to chat
              </Link>
            )}
          </div>
        )}

        {!isOwner && (
          <div className="shd-sub-card">
            <div className="shd-sub-icon">
              <Bell size={18} />
            </div>
            <div className="shd-sub-title">Stay updated</div>
            <div className="shd-sub-sub">
              Subscribe to get notified when {shop.name} adds new deals.
            </div>
            {isAuthenticated ? (
              <button
                className="shd-btn-sub"
                onClick={handleSubscribe}
                disabled={subscribed || subscribing}
                type="button"
              >
                {subscribed ? 'Subscribed' : '+ Subscribe'}
              </button>
            ) : (
              <Link href="/login" className="shd-btn-sub">
                Login to subscribe
              </Link>
            )}
          </div>
        )}

        {similarShops.length > 0 && (
          <div className="shd-similar-card">
            <div className="shd-sc-title">Similar shops</div>
            {similarShops.slice(0, 4).map((s) => (
              <Link key={s.id} href={`/shops/${s.id}`} className="shd-sc-item">
                <div className="shd-sc-av">{s.emoji || 'S'}</div>
                <div>
                  <div className="shd-sc-name">{s.name}</div>
                  <div className="shd-sc-meta">
                    {s.city || s.address || ''}
                    {s.rating != null ? ` | Rating ${s.rating.toFixed(1)}` : ''}
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
