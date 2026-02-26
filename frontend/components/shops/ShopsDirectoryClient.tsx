'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Package, MapPin, Star, Store, Users } from 'lucide-react';
import { getNearbyShops } from '@/lib/api/endpoints';
import type { Shop } from '@/types/api';

type Props = { shops: Shop[]; isAuthenticated: boolean; currentUserId?: string | null };
type Filter = 'all' | 'open' | 'vegetables' | 'seafood' | 'grains' | 'meats' | 'top' | 'near';
type SortKey = 'rating' | 'newest' | 'products';
type ViewMode = 'list' | 'grid';

const COVER_COLORS = ['', 'amber', 'teal'] as const;

function StarRating({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="scl-badge">
      <span className="scl-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`star${n > rounded ? ' empty' : ''}`}>
            <Star size={12} fill={n <= rounded ? 'currentColor' : 'none'} strokeWidth={1.8} />
          </span>
        ))}
      </span>
      <span>{value.toFixed(1)}</span>
    </span>
  );
}

function ShopListCard({
  shop,
  index,
  isAuthenticated,
  currentUserId,
}: { shop: Shop; index: number; isAuthenticated: boolean; currentUserId?: string | null }) {
  const color = COVER_COLORS[index % 3];
  const isOwnShop = Boolean(isAuthenticated && currentUserId && shop.ownerUserId && String(currentUserId) === String(shop.ownerUserId));
  return (
    <div className="shop-card-list">
      <div className={`scl-cover${color ? ` ${color}` : ''}`} />
      <div className="scl-inner">
        <div className="scl-avatar">
          {shop.image
            ? <img src={shop.image} alt={shop.name} />
            : <Store size={18} />}
        </div>
        <div className="scl-info">
          <div className="scl-name">{shop.name}</div>
          <div className="scl-addr">
            <MapPin size={12} />
            {[shop.address, shop.city].filter(Boolean).join(', ') || 'Location unavailable'}
          </div>
          <div className="scl-meta">
            <div className="scl-badge">
              <span className={`open-dot${shop.isOpen === false ? ' closed' : ''}`} />
              <span className={`open-lbl${shop.isOpen === false ? ' red' : ' green'}`}>
                {shop.isOpen === false ? 'Closed' : 'Open now'}
              </span>
            </div>
            {shop.productsCount != null && (
              <div className="scl-badge">
                <Package size={12} />
                {shop.productsCount} products
              </div>
            )}
            {shop.rating != null && <StarRating value={shop.rating} />}
            {shop.subscriberCount != null && (
              <div className="scl-badge"><Users size={12} /> {shop.subscriberCount} subscribers</div>
            )}
          </div>
        </div>
        <div className="scl-actions">
          <Link href={`/shops/${shop.id}`} className="btn-view-shop">View shop</Link>
          {isOwnShop ? (
            <Link href={`/messages?shop=${shop.id}&ownerInbox=1`} className="btn-chat">Messages</Link>
          ) : isAuthenticated ? (
            <Link href={`/messages?shop=${shop.id}`} className="btn-chat">Chat</Link>
          ) : (
            <Link href="/login" className="btn-chat">Login to chat</Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ShopGridCard({
  shop,
  index,
  isAuthenticated,
  currentUserId,
}: { shop: Shop; index: number; isAuthenticated: boolean; currentUserId?: string | null }) {
  const color = COVER_COLORS[index % 3];
  const isOwnShop = Boolean(isAuthenticated && currentUserId && shop.ownerUserId && String(currentUserId) === String(shop.ownerUserId));
  return (
    <Link href={`/shops/${shop.id}`} className="shop-card-grid">
      <div className={`scg-cover${color ? ` ${color}` : ''}`}>
        <div className="scg-open-badge">
          <div className={`dot${shop.isOpen === false ? ' closed' : ''}`} />
          {shop.isOpen === false ? 'Closed' : 'Open'}
        </div>
        <div className="scg-avatar">{shop.emoji || <Store size={20} />}</div>
      </div>
      <div className="scg-body">
        <div className="scg-name">{shop.name}</div>
        <div className="scg-addr">
          {[shop.address, shop.city].filter(Boolean).join(', ') || 'Location unavailable'}
        </div>
        <div className="scg-meta">
          {shop.productsCount != null && (
            <div className="scg-stat">Products {shop.productsCount}</div>
          )}
          {shop.rating != null && (
            <div className="scg-stat">Rating {shop.rating.toFixed(1)}</div>
          )}
          {shop.subscriberCount != null && (
            <div className="scg-stat">Subs {shop.subscriberCount}</div>
          )}
        </div>
        <div className="scg-footer">
          <span className="btn-view-shop">View shop</span>
          <span className="btn-chat">{isOwnShop ? 'Messages' : isAuthenticated ? 'Chat' : 'Login to chat'}</span>
        </div>
      </div>
    </Link>
  );
}

export function ShopsDirectoryClient({ shops, isAuthenticated, currentUserId }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('rating');
  const [view, setView] = useState<ViewMode>('list');
  const [nearbyShops, setNearbyShops] = useState<Shop[] | null>(null);
  const [nearLoading, setNearLoading] = useState(false);

  const activateFilter = (next: Filter) => {
    setFilter(next);
    if (next !== 'near' || nearbyShops || nearLoading) return;
    setNearLoading(true);
    void getNearbyShops()
      .then((result) => setNearbyShops(result.data))
      .catch(() => setNearbyShops([]))
      .finally(() => setNearLoading(false));
  };

  const filtered = useMemo(() => {
    let list = (filter === 'near' && nearbyShops ? nearbyShops : shops).slice();

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.city || '').toLowerCase().includes(q) ||
          (s.address || '').toLowerCase().includes(q),
      );
    }

    if (filter === 'open') list = list.filter((s) => s.isOpen !== false);
    if (filter === 'top') list = list.filter((s) => s.rating != null && s.rating >= 4.5);
    if (filter === 'vegetables') list = list.filter((s) => s.categories?.some((c) => /veg/i.test(c)));
    if (filter === 'seafood') list = list.filter((s) => s.categories?.some((c) => /sea|fish/i.test(c)));
    if (filter === 'grains') list = list.filter((s) => s.categories?.some((c) => /grain|bread|cereal/i.test(c)));
    if (filter === 'meats') list = list.filter((s) => s.categories?.some((c) => /meat|poultry|beef|chicken/i.test(c)));

    if (sort === 'rating') list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === 'products') list = [...list].sort((a, b) => (b.productsCount ?? 0) - (a.productsCount ?? 0));

    return list;
  }, [shops, nearbyShops, query, filter, sort]);

  const chips: { key: Filter; label: string; dot?: boolean }[] = [
    { key: 'all', label: 'All shops' },
    { key: 'open', label: 'Open now', dot: true },
    { key: 'vegetables', label: 'Vegetables' },
    { key: 'seafood', label: 'Seafood' },
    { key: 'grains', label: 'Grains' },
    { key: 'meats', label: 'Meats' },
    { key: 'top', label: 'Top rated 4.5+' },
    { key: 'near', label: 'Near me' },
  ];

  return (
    <div className="sd-wrap">
      {/* Header card */}
      <div className="sd-header-card">
        <div className="sd-hc-left">
          <h1>Browse <em>local shops</em></h1>
          <p>Search by shop name or location, then switch between list and grid views.</p>
          <p className="sd-count">Showing <strong>{filtered.length}</strong> shop{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="sd-hc-right">
          <div className="sd-search-pill">
            <Search size={16} />
            <input
              type="text"
              placeholder="Start typing a shop name or city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="sd-clear-btn" onClick={() => setQuery('')} type="button">Clear</button>
            )}
          </div>
          <div className="sd-view-row">
            <select
              className="sd-sort-sel"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="rating">Sort: Top rated</option>
              <option value="newest">Newest</option>
              <option value="products">Most products</option>
            </select>
            <div className="sd-view-toggle">
              <button
                className={`sd-vt-btn${view === 'list' ? ' active' : ''}`}
                onClick={() => setView('list')}
                type="button"
              >
                List
              </button>
              <button
                className={`sd-vt-btn${view === 'grid' ? ' active' : ''}`}
                onClick={() => setView('grid')}
                type="button"
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sd-filter-bar">
        <span className="sd-filter-label">Filter:</span>
        {chips.map((c) => (
          <button
            key={c.key}
            className={`sd-chip${filter === c.key ? ' active' : ''}`}
            onClick={() => activateFilter(c.key)}
            type="button"
          >
            {c.dot && <span className="sd-chip-dot" />}
            {c.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {filter === 'near' && nearLoading ? (
        <div className="sd-empty" style={{ marginBottom: 16 }}>
          <div className="sd-empty-sub">Finding nearby shops...</div>
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <div className="sd-empty">
          <span className="sd-empty-icon"><Store size={18} /></span>
          <div className="sd-empty-title">No shops found</div>
          <div className="sd-empty-sub">Try adjusting your search or filters.</div>
          <button
            onClick={() => { setQuery(''); setFilter('all'); }}
            type="button"
            className="btn-view-shop"
            style={{ marginTop: 16 }}
          >
            Clear filters
          </button>
        </div>
      ) : view === 'list' ? (
        <div className="shops-list">
          {filtered.map((shop, i) => (
            <ShopListCard key={shop.id} shop={shop} index={i} isAuthenticated={isAuthenticated} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="sd-grid">
          {filtered.map((shop, i) => (
            <ShopGridCard key={shop.id} shop={shop} index={i} isAuthenticated={isAuthenticated} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
