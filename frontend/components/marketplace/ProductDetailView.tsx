'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/api';
import { StartChatDialog } from '@/components/chat/StartChatDialog';
import {
  addToCart,
  addWishlist,
  getCart,
  getWishlist,
  removeWishlistByProduct,
  subscribeShop,
  updateCartItem
} from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
type Props = {
  product: Product;
  related: Product[];
  isAuthenticated: boolean;
  canSubscribeToShop?: boolean;
  chat?: {
    shopId: string;
    shopName: string;
    receiverUserId?: string;
    products: Array<{ id: string; name: string }>;
  } | null;
};
type Tab = 'description' | 'nutrition' | 'reviews';

// ---- Inline SVG icons ----
function IconCart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}
function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconShare() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}
function IconCopy() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
function IconStore() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconTruck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}
function IconStar({ filled }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#f5a623' : 'none'} stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function IconPlus() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconMinus() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconArrowRight() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}
function IconImage() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M21 16l-5-5-8 8" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

// ---- Helpers ----
function formatPrice(value: number) {
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type ExpiryUrgency = 'expired' | 'today' | 'soon' | 'week' | 'normal';
function getExpiryInfo(expiresOn: string | null | undefined): { label: string; urgency: ExpiryUrgency } | null {
  if (!expiresOn) return null;
  const now = new Date();
  const exp = new Date(expiresOn);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'This product has expired', urgency: 'expired' };
  if (diffDays === 0) return { label: 'Expires today - pick up fast!', urgency: 'today' };
  if (diffDays <= 2) return { label: `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'} - act quickly!`, urgency: 'soon' };
  if (diffDays <= 7) return { label: `Expires in ${diffDays} days`, urgency: 'week' };
  const fmt = exp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return { label: `Best before ${fmt}`, urgency: 'normal' };
}

function useCountdown(expiresOn: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!expiresOn) return;
    const tick = () => {
      const diff = new Date(expiresOn).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      if (h >= 24) { setTimeLeft(`${Math.floor(h / 24)}d ${h % 24}h left`); return; }
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresOn]);
  return timeLeft;
}

// ---- Gallery ----
function ProductGallery({ images, name, expiresOn, discountPercent }: {
  images: string[];
  name: string;
  expiresOn?: string | null;
  discountPercent?: number | null;
}) {
  const [selected, setSelected] = useState(0);
  const countdown = useCountdown(expiresOn);
  const expInfo = getExpiryInfo(expiresOn);
  const isUrgent = expInfo && (expInfo.urgency === 'today' || expInfo.urgency === 'soon');

  return (
    <div className="pd-gallery">
      <div className="pd-gallery-main">
        {discountPercent ? <div className="pd-gallery-discount">{discountPercent}% OFF</div> : null}
        {countdown ? (
          <div className={`pd-gallery-countdown${isUrgent ? ' urgent' : ''}`}>
            <IconClock /><span>{countdown}</span>
          </div>
        ) : null}
        {images[selected]
          ? <img src={images[selected]} alt={name} className="pd-gallery-img" />
          : <div className="pd-gallery-placeholder"><IconImage /></div>
        }
      </div>
      {images.length > 1 && (
        <div className="pd-thumb-row">
          {images.map((img, i) => (
            <button key={i} type="button" className={`pd-thumb${selected === i ? ' active' : ''}`} onClick={() => setSelected(i)}>
              <img src={img} alt={`${name} view ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Quantity stepper ----
function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="pd-qty-row">
      <button type="button" className="pd-qty-btn" onClick={() => onChange(Math.max(1, value - 1))}><IconMinus /></button>
      <span className="pd-qty-val">{value}</span>
      <button type="button" className="pd-qty-btn" onClick={() => onChange(value + 1)}><IconPlus /></button>
    </div>
  );
}

// ---- Reviews tab ----
type ReviewData = { id: string; author: string; rating: number; body: string; createdAt: string };

function ReviewsTab({ reviewCount }: { reviewCount?: number | null }) {
  const reviews: ReviewData[] = [];
  const [form, setForm] = useState({ rating: 5, body: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isPending, start] = useTransition();

  const totalRatings = reviews.length;
  const avgRating = totalRatings ? reviews.reduce((s, r) => s + r.rating, 0) / totalRatings : 0;
  const ratingCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    return counts.reverse();
  }, [reviews]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.body.trim()) return;
    start(async () => {
      setSubmitted(true);
    });
  };

  return (
    <div className="pd-reviews">
      <div className="pd-review-summary">
        <div className="pd-review-score">
          <div className="pd-review-big">{avgRating > 0 ? avgRating.toFixed(1) : '-'}</div>
          <div className="pd-stars-row">
            {[1, 2, 3, 4, 5].map((n) => <IconStar key={n} filled={n <= Math.round(avgRating)} />)}
          </div>
          <div className="pd-review-count">{reviewCount ?? totalRatings} review{(reviewCount ?? totalRatings) !== 1 ? 's' : ''}</div>
        </div>
        <div className="pd-review-bars">
          {[5, 4, 3, 2, 1].map((star, i) => {
            const count = ratingCounts[i] || 0;
            const pct = totalRatings ? Math.round((count / totalRatings) * 100) : 0;
            return (
              <div key={star} className="pd-bar-row">
                <span className="pd-bar-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  {star} <IconStar filled />
                </span>
                <div className="pd-bar-track"><div className="pd-bar-fill" style={{ width: `${pct}%` }} /></div>
                <span className="pd-bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pd-write-review">
        <div className="pd-wr-title">Write a Review</div>
        {submitted ? (
          <div className="pd-wr-thanks">Thank you! Your review will be visible after moderation.</div>
        ) : (
          <form onSubmit={handleSubmit} className="pd-wr-form">
            <div className="pd-wr-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className={`pd-wr-star${form.rating >= n ? ' lit' : ''}`} onClick={() => setForm((f) => ({ ...f, rating: n }))}>
                  <IconStar filled={form.rating >= n} />
                </button>
              ))}
            </div>
            <textarea
              className="pd-wr-textarea"
              placeholder="Share your thoughts about this product..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={4}
            />
            <button type="submit" className="pd-wr-submit" disabled={isPending || !form.body.trim()}>
              {isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="pd-reviews-list">
          {reviews.map((r) => (
            <div key={r.id} className="pd-review-card">
              <div className="pd-rc-header">
                <div className="pd-rc-avatar">{r.author[0].toUpperCase()}</div>
                <div className="pd-rc-meta">
                  <div className="pd-rc-author">{r.author}</div>
                  <div className="pd-stars-row">{[1, 2, 3, 4, 5].map((n) => <IconStar key={n} filled={n <= r.rating} />)}</div>
                </div>
                <div className="pd-rc-date">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <p className="pd-rc-body">{r.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="pd-reviews-empty">No reviews yet. Be the first to review this product!</div>
      )}
    </div>
  );
}

// ---- Related product card ----
function RelatedCard({ product, index }: { product: Product; index: number }) {
  const expInfo = getExpiryInfo(product.expiresOn);
  const discount = product.discountPercent ?? (product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null);

  return (
    <Link href={`/products/${product.id}`} className="pd-related-card" style={{ animationDelay: `${index * 0.07}s` }}>
      <div className="pd-rc2-img">
        {product.image ? <img src={product.image} alt={product.name} /> : <span className="pd-rc2-emoji"><IconImage /></span>}
        {discount ? <div className="pd-rc2-badge">{discount}% OFF</div> : null}
      </div>
      <div className="pd-rc2-body">
        {product.shopName && <div className="pd-rc2-shop">{product.shopName}</div>}
        <div className="pd-rc2-name">{product.name}</div>
        {expInfo && expInfo.urgency !== 'normal' && (
          <div className={`pd-rc2-expiry ${expInfo.urgency}`}><IconClock /> {expInfo.label}</div>
        )}
        <div className="pd-rc2-price">
          <span className="pd-rc2-new">{formatPrice(product.price)}</span>
          {product.oldPrice && <span className="pd-rc2-old">{formatPrice(product.oldPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}

// ---- Main export ----
export function ProductDetailView({
  product,
  related,
  chat,
  isAuthenticated,
  canSubscribeToShop = true,
}: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [inCartQty, setInCartQty] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [notice, setNotice] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isPending, start] = useTransition();

  const gallery = useMemo(() => {
    const imgs = [product.image, ...(product.gallery || [])].filter(Boolean) as string[];
    return Array.from(new Set(imgs)).slice(0, 3);
  }, [product.image, product.gallery]);

  const discount = product.discountPercent ?? (product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null);

  const expInfo = getExpiryInfo(product.expiresOn);
  const categories = product.categories?.length ? product.categories : product.category ? [product.category] : [];
  const filledStars = Math.round(Math.max(0, Math.min(5, product.rating ?? 0)));
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/products/${product.id}`;

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlisted(false);
      return;
    }
    let active = true;
    void getWishlist()
      .then((response) => {
        if (!active) return;
        const exists = response.data.some((item) => String(item.id) === String(product.id));
        setWishlisted(exists);
      })
      .catch(() => {
        if (active) setWishlisted(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, product.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setInCartQty(0);
      setQty(1);
      return;
    }
    let active = true;
    void getCart()
      .then((cart) => {
        if (!active) return;
        const existing = cart.items.find((item) => String(item.productId) === String(product.id));
        const nextQty = existing?.quantity ?? 0;
        setInCartQty(nextQty);
        if (nextQty > 0) setQty(nextQty);
      })
      .catch(() => {
        if (!active) return;
        setInCartQty(0);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, product.id]);

  const onQtyChange = (nextQty: number) => {
    setQty(nextQty);
    if (!isAuthenticated || inCartQty < 1) return;
    start(async () => {
      try {
        await updateCartItem(product.id, nextQty);
        setInCartQty(nextQty);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:refresh'));
      } catch {
        // Keep UI responsive; add-to-cart remains available as fallback.
      }
    });
  };

  const onAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/login?next=%2Fproducts');
      return;
    }
    setNotice(null);
    start(async () => {
      try {
        if (inCartQty > 0) {
          await updateCartItem(product.id, qty);
        } else {
          await addToCart(product.id, qty);
        }
        setInCartQty(qty);
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:refresh'));
        setNotice({ msg: `${product.name} cart quantity is now ${qty}.`, ok: true });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push('/login?next=%2Fproducts');
          return;
        }
        setNotice({ msg: 'Could not add to cart. Please try again.', ok: false });
      }
    });
  };

  const onWishlist = () => {
    if (!isAuthenticated) {
      router.push('/login?next=%2Fproducts');
      return;
    }
    const next = !wishlisted;
    setWishlisted(next);
    if (next) {
      addWishlist(product.id)
        .then(() => {
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('wishlist:refresh'));
          setNotice({ msg: 'Added to wishlist!', ok: true });
        })
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401) {
            router.push('/login?next=%2Fproducts');
            return;
          }
          setWishlisted(false);
          setNotice({ msg: 'Could not update wishlist right now.', ok: false });
        });
      return;
    }
    removeWishlistByProduct(product.id)
      .then(() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('wishlist:refresh'));
        setNotice({ msg: 'Removed from wishlist.', ok: true });
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          router.push('/login?next=%2Fproducts');
          return;
        }
        setWishlisted(true);
        setNotice({ msg: 'Could not update wishlist right now.', ok: false });
      });
  };

  const onSubscribe = () => {
    if (!product.shopId || subscribed) return;
    setSubscribed(true);
    subscribeShop(product.shopId)
      .then(() => setNotice({ msg: 'Subscribed to shop! You will receive updates.', ok: true }))
      .catch(() => {
        setSubscribed(false);
        setNotice({ msg: 'Could not subscribe right now.', ok: false });
      });
  };

  const onCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setNotice({ msg: 'Link copied to clipboard!', ok: true });
  };

  return (
    <div className="pd-page">
      {/* ---- Main product card ---- */}
      <div className="pd-card">
        {/* Gallery */}
        <ProductGallery
          images={gallery}
          name={product.name}
          expiresOn={product.expiresOn}
          discountPercent={discount}
        />

        {/* Info column */}
        <div className="pd-info">
          {product.shopName && (
            <Link href={product.shopId ? `/shops/${product.shopId}` : '/shops'} className="pd-shop-link">
              <IconStore /> {product.shopName}
            </Link>
          )}

          <h1 className="pd-title">{product.name}</h1>

          <div className="pd-rating-row">
            <div className="pd-stars-row">
              {[1, 2, 3, 4, 5].map((n) => <IconStar key={n} filled={n <= filledStars} />)}
            </div>
            {product.reviewCount != null && (
              <button type="button" className="pd-review-lnk" onClick={() => setActiveTab('reviews')}>
                ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
              </button>
            )}
          </div>

          {expInfo && expInfo.urgency !== 'normal' && (
            <div className={`pd-expiry-banner ${expInfo.urgency}`}>
              <IconClock /> {expInfo.label}
            </div>
          )}

          <div className="pd-price-block">
            <span className="pd-price-new">{formatPrice(product.price)}</span>
            {product.oldPrice ? <span className="pd-price-old">{formatPrice(product.oldPrice)}</span> : null}
            {discount ? <span className="pd-save-badge">Save {discount}%</span> : null}
            {discount && product.oldPrice ? (
              <span className="pd-save-line">You save {formatPrice(product.oldPrice - product.price)}</span>
            ) : null}
          </div>

          <p className="pd-short-desc">
            {product.shortDescription || product.description || 'Fresh deal from a verified local shop.'}
          </p>

          <div className="pd-action-row">
            <QuantityStepper value={qty} onChange={onQtyChange} />
            <button type="button" className="pd-cart-btn" onClick={onAddToCart} disabled={isPending}>
              <IconCart /> {isPending ? 'Saving...' : inCartQty > 0 ? 'Update Cart' : 'Add to Cart'}
            </button>
            <button type="button" className={`pd-wish-btn${wishlisted ? ' wishlisted' : ''}`} onClick={onWishlist} aria-label="Wishlist">
              <IconHeart filled={wishlisted} />
            </button>
          </div>

          {chat ? (
            <div className="pd-chat-panel">
              {isAuthenticated ? (
                <StartChatDialog
                  shopId={chat.shopId}
                  shopName={chat.shopName}
                  receiverUserId={chat.receiverUserId}
                  products={chat.products}
                  defaultProductId={product.id}
                  triggerLabel="Start chat with shop"
                  triggerClassName="pd-subscribe-btn"
                />
              ) : (
                <Link href="/login" className="pd-subscribe-btn">
                  Login to chat
                </Link>
              )}
              <div className="pd-chat-link-row">
                <Link
                  href={`/messages?shop=${encodeURIComponent(chat.shopId)}&product=${encodeURIComponent(product.id)}`}
                  className="pd-review-lnk"
                >
                  Open chat composer in inbox
                </Link>
              </div>
            </div>
          ) : null}

          {notice && <div className={`pd-notice${notice.ok ? ' ok' : ' err'}`}>{notice.msg}</div>}

          {canSubscribeToShop ? (
            isAuthenticated ? (
              <button
                type="button"
                className={`pd-subscribe-btn${subscribed ? ' subscribed' : ''}`}
                disabled={!product.shopId || subscribed}
                onClick={onSubscribe}
              >
                <IconBell /> {subscribed ? 'Subscribed' : 'Subscribe to this Shop'}
              </button>
            ) : (
              <Link href="/login" className="pd-subscribe-btn">
                <IconBell /> Login to subscribe
              </Link>
            )
          ) : null}

          <div className="pd-divider" />

          {/* Meta grid */}
          <div className="pd-meta-grid">
            {categories.length > 0 && (
              <div className="pd-meta-row">
                <span className="pd-meta-lbl">Category</span>
                <div className="pd-cat-pills">
                  {categories.map((c) => <span key={c} className="pd-cat-pill">{c}</span>)}
                </div>
              </div>
            )}
            {product.delivery && (
              <div className="pd-meta-row">
                <span className="pd-meta-lbl"><IconTruck /> Delivery</span>
                <span className="pd-meta-val">{product.delivery}</span>
              </div>
            )}
            {product.shopName && (
              <div className="pd-meta-row">
                <span className="pd-meta-lbl"><IconStore /> Sold by</span>
                <Link href={product.shopId ? `/shops/${product.shopId}` : '/shops'} className="pd-meta-link">
                  {product.shopName} <IconArrowRight />
                </Link>
              </div>
            )}
            <div className="pd-meta-row">
              <span className="pd-meta-lbl"><IconShare /> Share</span>
              <div className="pd-share-row">
                <button type="button" className="pd-share-btn" onClick={onCopyLink} title="Copy link">
                  <IconCopy />
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                  className="pd-share-btn whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share on WhatsApp"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <div className="pd-tabs-wrap">
        <div className="pd-tab-bar">
          {(['description', 'nutrition', 'reviews'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`pd-tab-btn${activeTab === t ? ' active' : ''}`}
              onClick={() => setActiveTab(t)}
            >
              {t === 'description' ? 'Description'
                : t === 'nutrition' ? 'Nutrition Info'
                : `Reviews${product.reviewCount ? ` (${product.reviewCount})` : ''}`}
            </button>
          ))}
        </div>
        <div className="pd-tab-panel">
          {activeTab === 'description' && (
            <div className="pd-desc-content">
              {product.description
                ? <p>{product.description}</p>
                : <p className="pd-desc-empty">No description provided for this product.</p>}
              {expInfo && expInfo.urgency !== 'normal' && (
                <div className={`pd-desc-expiry ${expInfo.urgency}`}><IconClock /> {expInfo.label}</div>
              )}
            </div>
          )}
          {activeTab === 'nutrition' && (
            <div className="pd-nutrition">
              <p className="pd-nutrition-note">Nutritional information is provided by the seller. Always check packaging for accurate details.</p>
              <div className="pd-nutrition-placeholder"><span><IconInfo /></span><p>Nutrition details not yet available for this product.</p></div>
            </div>
          )}
          {activeTab === 'reviews' && <ReviewsTab reviewCount={product.reviewCount} />}
        </div>
      </div>

      {/* ---- Related products ---- */}
      <div className="pd-related-wrap">
        <div className="pd-related-head">
          <h2 className="pd-related-title">Related <em>Products</em></h2>
          <Link href="/products" className="pd-related-see-all">See all <IconArrowRight /></Link>
        </div>
        {related.length > 0 ? (
          <div className="pd-related-grid">
            {related.map((p, i) => <RelatedCard key={p.id} product={p} index={i} />)}
          </div>
        ) : (
          <div className="pd-related-empty">
            <span><IconStore /></span>
            <p>No related products found. <Link href="/products">Browse all products</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
