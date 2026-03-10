'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/api';
import { addToCart, addWishlist, getWishlist, removeWishlistByProduct } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { getProductPath } from '@/lib/products';

type SortKey = 'latest' | 'price-asc' | 'price-desc' | 'expiry' | 'discount';
type ViewMode = 'list' | 'grid';
type ExpiryWindow = 'today' | 'days2' | 'week';

const PAGE_SIZE = 12;

/* ── Inline SVG icons ── */
function IconSearch() {
  return (
    <svg className="pl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconStore() {
  return (
    <svg className="pl-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="pl-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconCart() {
  return (
    <svg className="pl-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function IconHeart({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className="pl-icon-sm"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg className="pl-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ── Helpers ── */
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  if (isNaN(expiry.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryInfo(expiresOn: string | null | undefined): {
  label: string | null;
  urgency: 'today' | 'soon' | 'normal' | null;
} {
  const days = daysUntil(expiresOn);
  if (days === null) return { label: null, urgency: null };
  if (days < 0) return { label: 'Expired', urgency: 'today' };
  if (days === 0) return { label: 'Expires today — pick up fast!', urgency: 'today' };
  if (days === 1) return { label: 'Expires in 1 day', urgency: 'soon' };
  if (days <= 2) return { label: `Expires in ${days} days`, urgency: 'soon' };
  if (days <= 7) return { label: `Expires in ${days} days`, urgency: 'normal' };
  return { label: null, urgency: null };
}

function getProductEmoji(product: Product): string {
  const cat = (product.category || product.categories?.[0] || '').toLowerCase();
  if (cat.includes('veg')) return '🥬';
  if (cat.includes('fruit')) return '🍎';
  if (cat.includes('bread') || cat.includes('bak')) return '🍞';
  if (cat.includes('milk') || cat.includes('dairy')) return '🥛';
  if (cat.includes('meat') || cat.includes('poultry') || cat.includes('chicken')) return '🥩';
  if (cat.includes('fish') || cat.includes('seafood')) return '🐟';
  if (cat.includes('grain') || cat.includes('rice') || cat.includes('cereal')) return '🌾';
  return '🛒';
}

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | '...')[] = [1];
  if (current > 3) range.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) range.push(i);
  if (current < total - 2) range.push('...');
  range.push(total);
  return range;
}

/* ── List card ── */
function ProductListCard({
  product,
  animIndex,
  wishlisted,
  isBusy,
  onAddToCart,
  onToggleWishlist,
}: {
  product: Product;
  animIndex: number;
  wishlisted: boolean;
  isBusy: boolean;
  onAddToCart: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
}) {
  const expiry = getExpiryInfo(product.expiresOn);
  const emoji = getProductEmoji(product);
  const urgencyClass = expiry.urgency === 'today' ? ' urgent' : expiry.urgency === 'soon' ? ' warn' : '';

  return (
    <div className="pl-prod-card-list" style={{ animationDelay: `${animIndex * 0.04}s` }}>
      <div className="pl-pcl-img">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <span>{emoji}</span>
        )}
        <div className="pl-pcl-badges">
          {product.discountPercent && product.discountPercent >= 30 ? (
            <span className="pl-badge off">{product.discountPercent}% OFF</span>
          ) : null}
          {expiry.urgency === 'today' ? (
            <span className="pl-badge exp-today">Exp today</span>
          ) : expiry.urgency === 'soon' ? (
            <span className="pl-badge exp-days">Exp soon</span>
          ) : null}
        </div>
      </div>

      <div className="pl-pcl-body">
        {product.shopName ? (
          <div className="pl-pcl-shop">
            <IconStore /> {product.shopName}
          </div>
        ) : null}

        <Link href={getProductPath(product)} className="pl-pcl-name-link">
          <div className="pl-pcl-name">{product.name}</div>
        </Link>

        {product.shortDescription || product.description ? (
          <p className="pl-pcl-desc">{product.shortDescription || product.description}</p>
        ) : null}

        {expiry.label ? (
          <div className={`pl-pcl-expiry${urgencyClass}`}>
            <IconClock /> {expiry.label}
          </div>
        ) : null}

        <div className="pl-pcl-footer">
          <span className="pl-pcl-price-now">£{product.price.toFixed(2)}</span>
          {product.oldPrice ? (
            <span className="pl-pcl-price-was">£{product.oldPrice.toFixed(2)}</span>
          ) : null}
          {product.discountPercent ? (
            <span className="pl-pcl-disc">{product.discountPercent}% OFF</span>
          ) : null}
          <div className="pl-pcl-actions">
            <button
              type="button"
              className="pl-btn-cart"
              onClick={() => onAddToCart(product.id)}
              disabled={isBusy}
            >
              <IconCart /> Add to cart
            </button>
            <button
              type="button"
              className={`pl-btn-wish${wishlisted ? ' wishlisted' : ''}`}
              onClick={() => onToggleWishlist(product.id)}
              disabled={isBusy}
              aria-label="Add to wishlist"
            >
              <IconHeart filled={wishlisted} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Grid card ── */
function ProductGridCard({
  product,
  animIndex,
  wishlisted,
  isBusy,
  onAddToCart,
  onToggleWishlist,
}: {
  product: Product;
  animIndex: number;
  wishlisted: boolean;
  isBusy: boolean;
  onAddToCart: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
}) {
  const expiry = getExpiryInfo(product.expiresOn);
  const emoji = getProductEmoji(product);
  const urgencyClass = expiry.urgency === 'today' ? ' urgent' : expiry.urgency === 'soon' ? ' warn' : '';

  return (
    <div className="pl-prod-card-grid" style={{ animationDelay: `${animIndex * 0.04}s` }}>
      <div className="pl-pcg-thumb">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <span>{emoji}</span>
        )}
        <div className="pl-pcg-badges">
          {product.discountPercent && product.discountPercent >= 30 ? (
            <span className="pl-badge off">{product.discountPercent}% OFF</span>
          ) : null}
        </div>
        <button
          type="button"
          className={`pl-pcg-wish${wishlisted ? ' wishlisted' : ''}`}
          onClick={() => onToggleWishlist(product.id)}
          disabled={isBusy}
          aria-label="Add to wishlist"
        >
          <IconHeart filled={wishlisted} />
        </button>
      </div>

      <div className="pl-pcg-body">
        {product.shopName ? (
          <div className="pl-pcg-shop">{product.shopName}</div>
        ) : null}

        <Link href={getProductPath(product)} className="pl-pcg-name-link">
          <div className="pl-pcg-name">{product.name}</div>
        </Link>

        {product.shortDescription || product.description ? (
          <div className="pl-pcg-desc">{product.shortDescription || product.description}</div>
        ) : null}

        {expiry.label ? (
          <div className={`pl-pcg-expiry${urgencyClass}`}>
            <IconClock /> {expiry.label}
          </div>
        ) : null}

        <div className="pl-pcg-footer">
          <span className="pl-pcg-now">£{product.price.toFixed(2)}</span>
          {product.oldPrice ? (
            <span className="pl-pcg-was">£{product.oldPrice.toFixed(2)}</span>
          ) : null}
          {product.discountPercent ? (
            <span className="pl-pcg-disc">{product.discountPercent}%</span>
          ) : null}
          <button
            type="button"
            className="pl-btn-pcg-cart"
            onClick={() => onAddToCart(product.id)}
            disabled={isBusy}
            aria-label="Add to cart"
          >
            <IconPlus />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
type Props = {
  products: Product[];
  allCategories: string[];
  initialSelectedCategories?: string[];
  isAuthenticated?: boolean;
};

export function ProductListClient({
  products,
  allCategories,
  initialSelectedCategories = [],
  isAuthenticated = false,
}: Props) {
  const router = useRouter();
  const priceMax = useMemo(() => Math.max(50, ...products.map((p) => p.price)), [products]);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCategories);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, priceMax]);
  const [expiryWindows, setExpiryWindows] = useState<ExpiryWindow[]>([]);
  const [nearby, setNearby] = useState(false);
  const [sort, setSort] = useState<SortKey>('latest');
  const [view, setView] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [wishlistedIds, setWishlistedIds] = useState<Record<string, boolean>>({});
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setPriceRange([0, priceMax]); }, [priceMax]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedQuery(value); setPage(1); }, 350);
  };

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
    setPage(1);
  }, []);

  const toggleExpiry = useCallback((w: ExpiryWindow) => {
    setExpiryWindows((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let list = products.slice();

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.shopName || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q),
      );
    }

    if (selectedCategories.length > 0) {
      list = list.filter((p) => {
        const cats = p.categories?.length ? p.categories : p.category ? [p.category] : [];
        return cats.some((c) => selectedCategories.includes(c));
      });
    }

    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (expiryWindows.length > 0) {
      list = list.filter((p) => {
        const days = daysUntil(p.expiresOn);
        if (days === null || days < 0) return false;
        return expiryWindows.some((w) => {
          if (w === 'today') return days === 0;
          if (w === 'days2') return days <= 2;
          if (w === 'week') return days <= 6;
          return false;
        });
      });
    }

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'expiry') {
      list = [...list].sort((a, b) => (daysUntil(a.expiresOn) ?? 9999) - (daysUntil(b.expiresOn) ?? 9999));
    } else if (sort === 'discount') {
      list = [...list].sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
    }

    return list;
  }, [products, debouncedQuery, selectedCategories, priceRange, expiryWindows, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginationRange = getPaginationRange(page, totalPages);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    expiryWindows.length > 0 ||
    nearby ||
    priceRange[0] > 0 ||
    priceRange[1] < priceMax ||
    debouncedQuery.trim().length > 0;

  const clearAll = () => {
    setSelectedCategories([]);
    setExpiryWindows([]);
    setNearby(false);
    setPriceRange([0, priceMax]);
    setQuery('');
    setDebouncedQuery('');
    setPage(1);
  };

  const productNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const product of products) {
      map[String(product.id)] = product.name || 'Product';
    }
    return map;
  }, [products]);

  useEffect(() => {
    if (!actionNotice) return;
    const timeoutId = window.setTimeout(() => setActionNotice(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [actionNotice]);

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistedIds({});
      return;
    }
    let active = true;
    void getWishlist()
      .then((response) => {
        if (!active) return;
        const next: Record<string, boolean> = {};
        for (const item of response.data) {
          if (item?.id) next[String(item.id)] = true;
        }
        setWishlistedIds(next);
      })
      .catch(() => {
        if (active) setWishlistedIds({});
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return false;
    router.push(`/login?next=${encodeURIComponent('/products')}`);
    return true;
  }, [isAuthenticated, router]);

  const setBusy = useCallback((productId: string, busy: boolean) => {
    setBusyIds((prev) => ({ ...prev, [productId]: busy }));
  }, []);

  const handleAddToCart = useCallback(async (productId: string) => {
    if (requireAuth()) return;
    setBusy(productId, true);
    setActionNotice(null);
    setActionError(null);
    try {
      await addToCart(productId, 1);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:refresh'));
      const name = productNameById[productId] ?? 'Product';
      setActionNotice(`${name} added to cart.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push(`/login?next=${encodeURIComponent('/products')}`);
        return;
      }
      setActionError('Could not add to cart right now. Please try again.');
    } finally {
      setBusy(productId, false);
    }
  }, [productNameById, requireAuth, router, setBusy]);

  const handleToggleWishlist = useCallback(async (productId: string) => {
    if (requireAuth()) return;
    const nextWishlisted = !wishlistedIds[productId];
    setWishlistedIds((prev) => ({ ...prev, [productId]: nextWishlisted }));
    setBusy(productId, true);
    setActionError(null);
    try {
      if (nextWishlisted) await addWishlist(productId);
      else await removeWishlistByProduct(productId);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('wishlist:refresh'));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push(`/login?next=${encodeURIComponent('/products')}`);
        return;
      }
      setWishlistedIds((prev) => ({ ...prev, [productId]: !nextWishlisted }));
      setActionError('Could not update wishlist right now. Please try again.');
    } finally {
      setBusy(productId, false);
    }
  }, [requireAuth, router, setBusy, wishlistedIds]);

  return (
    <div className="pl-page">
      <div className="pl-body">

        {/* ─── Sidebar ─── */}
        <aside className="pl-sidebar">

          {/* Search */}
          <div className="pl-sb-card">
            <div className="pl-sb-title">Search Products</div>
            <div className="pl-sb-search">
              <IconSearch />
              <input
                type="text"
                placeholder="e.g. bread, milk, rice…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    setDebouncedQuery(query);
                    setPage(1);
                  }
                }}
              />
              {query ? (
                <button
                  type="button"
                  className="pl-sb-clear"
                  onClick={() => { setQuery(''); setDebouncedQuery(''); setPage(1); }}
                  aria-label="Clear search"
                >×</button>
              ) : null}
            </div>
          </div>

          {/* Categories — checkboxes */}
          {allCategories.length > 0 ? (
            <div className="pl-sb-card">
              <div className="pl-sb-title">Product Categories</div>
              <div className="pl-cat-list">
                {allCategories.map((cat) => (
                  <label key={cat} className="pl-cat-item">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span className="pl-cat-label">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {/* Price range */}
          <div className="pl-sb-card">
            <div className="pl-sb-title">Filter by Price</div>
            <div className="pl-dual-range">
              <input
                type="range"
                className="pl-range-input pl-range-min"
                min={0} max={priceMax} step={0.5}
                value={priceRange[0]}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), priceRange[1] - 0.5);
                  setPriceRange([val, priceRange[1]]); setPage(1);
                }}
              />
              <input
                type="range"
                className="pl-range-input pl-range-max"
                min={0} max={priceMax} step={0.5}
                value={priceRange[1]}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), priceRange[0] + 0.5);
                  setPriceRange([priceRange[0], val]); setPage(1);
                }}
              />
            </div>
            <p className="pl-price-display">
              Price: <span>£{priceRange[0].toFixed(2)}</span> – <span>£{priceRange[1].toFixed(2)}</span>
            </p>
          </div>

          {/* Expiry window */}
          <div className="pl-sb-card">
            <div className="pl-sb-title">Expiry Window</div>
            <div className="pl-expiry-list">
              {(
                [
                  { value: 'today', dot: 'today', label: 'Expires today' },
                  { value: 'days2', dot: 'days2', label: 'Within 2 days' },
                  { value: 'week',  dot: 'week',  label: 'This week' },
                ] as { value: ExpiryWindow; dot: string; label: string }[]
              ).map((opt) => (
                <label key={opt.value} className="pl-expiry-chip">
                  <input
                    type="checkbox"
                    checked={expiryWindows.includes(opt.value)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...expiryWindows, opt.value]
                        : expiryWindows.filter((v) => v !== opt.value);
                      setExpiryWindows(next); setPage(1);
                    }}
                  />
                  <span className={`pl-expiry-dot ${opt.dot}`} />
                  <span className="pl-expiry-chip-lbl">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nearby shops */}
          <div className="pl-sb-card">
            <div className="pl-sb-title">Nearby Shops</div>
            <div
              className="pl-nearby-toggle"
              onClick={() => { setNearby((v) => !v); setPage(1); }}
              role="switch"
              aria-checked={nearby}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { setNearby((v) => !v); setPage(1); } }}
            >
              <div className={`pl-toggle-sw${nearby ? ' on' : ''}`} />
              <span className="pl-toggle-lbl">Show shops close to me</span>
            </div>
          </div>

        </aside>

        {/* ─── Main ─── */}
        <div className="pl-main">

          {/* Toolbar */}
          <div className="pl-toolbar">
            <div className="pl-sort-wrap">
              <span className="pl-sort-lbl">Sort By</span>
              <select
                className="pl-sort-sel"
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
              >
                <option value="latest">Latest Items</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="expiry">Expiry: Soonest</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>
            <div className="pl-view-toggle">
              <button
                type="button"
                className={`pl-vt-btn${view === 'grid' ? ' active' : ''}`}
                onClick={() => setView('grid')}
              >⊞ Grid</button>
              <button
                type="button"
                className={`pl-vt-btn${view === 'list' ? ' active' : ''}`}
                onClick={() => setView('list')}
              >≡ List</button>
            </div>
            <span className="pl-result-count">
              Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {/* Active filters */}
          {actionNotice ? (
            <div className="pl-active-filters" role="status" aria-live="polite">
              <span className="pl-af-label" style={{ color: '#166534' }}>{actionNotice}</span>
            </div>
          ) : null}
          {actionError ? (
            <div className="pl-active-filters" role="status" aria-live="polite">
              <span className="pl-af-label" style={{ color: '#b42318' }}>{actionError}</span>
            </div>
          ) : null}
          {hasActiveFilters ? (
            <div className="pl-active-filters">
              <span className="pl-af-label">Active filters:</span>
              {debouncedQuery.trim() ? (
                <button type="button" className="pl-af-chip"
                  onClick={() => { setQuery(''); setDebouncedQuery(''); setPage(1); }}>
                  {debouncedQuery} <span className="x">✕</span>
                </button>
              ) : null}
              {selectedCategories.map((cat) => (
                <button key={cat} type="button" className="pl-af-chip" onClick={() => toggleCategory(cat)}>
                  {cat} <span className="x">✕</span>
                </button>
              ))}
              {expiryWindows.map((w) => (
                <button key={w} type="button" className="pl-af-chip" onClick={() => toggleExpiry(w)}>
                  {w === 'today' ? 'Expires today' : w === 'days2' ? 'Within 2 days' : 'This week'}{' '}
                  <span className="x">✕</span>
                </button>
              ))}
              {nearby ? (
                <button type="button" className="pl-af-chip"
                  onClick={() => { setNearby(false); setPage(1); }}>
                  Near me <span className="x">✕</span>
                </button>
              ) : null}
              {priceRange[0] > 0 || priceRange[1] < priceMax ? (
                <button type="button" className="pl-af-chip"
                  onClick={() => { setPriceRange([0, priceMax]); setPage(1); }}>
                  £{priceRange[0].toFixed(2)}–£{priceRange[1].toFixed(2)} <span className="x">✕</span>
                </button>
              ) : null}
              <button type="button" className="pl-btn-clear-all" onClick={clearAll}>Clear all</button>
            </div>
          ) : null}

          {/* Products */}
          {paged.length === 0 ? (
            <div className="pl-empty-state">
              <span className="pl-es-icon">🛒</span>
              <div className="pl-es-title">No products found</div>
              <p className="pl-es-sub">
                {debouncedQuery.trim()
                  ? `No results for "${debouncedQuery}". Try a different term or adjust your filters.`
                  : 'Nothing matches the current filters. Try removing some.'}
              </p>
              <button type="button" className="pl-btn-reset" onClick={clearAll}>Clear all filters</button>
            </div>
          ) : view === 'list' ? (
            <div className="pl-products-list">
              {paged.map((p, i) => (
                <ProductListCard
                  key={p.id}
                  product={p}
                  animIndex={i}
                  wishlisted={Boolean(wishlistedIds[p.id])}
                  isBusy={Boolean(busyIds[p.id])}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="pl-products-grid">
              {paged.map((p, i) => (
                <ProductGridCard
                  key={p.id}
                  product={p}
                  animIndex={i}
                  wishlisted={Boolean(wishlistedIds[p.id])}
                  isBusy={Boolean(busyIds[p.id])}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="pl-pagination">
              <button
                type="button"
                className="pl-pag-btn arrow"
                disabled={page <= 1}
                onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >←</button>
              {paginationRange.map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="pl-pag-ellipsis">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`pl-pag-btn${page === item ? ' active' : ''}`}
                    onClick={() => { setPage(item as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >{item}</button>
                ),
              )}
              <button
                type="button"
                className="pl-pag-btn arrow"
                disabled={page >= totalPages}
                onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >→</button>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
