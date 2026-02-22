'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Product, Shop } from '@/types/api';

type Props = {
  shops: Shop[];
  products: Product[];
};

const categoryItems = [
  { label: 'Vegetables', icon: '🥦', bg: '#dcfce7' },
  { label: 'Fruits', icon: '🍎', bg: '#ffedd5' },
  { label: 'Grains', icon: '🌾', bg: '#fef9c3' },
  { label: 'Seafood', icon: '🐟', bg: '#dbeafe' },
  { label: 'Spices', icon: '🌶️', bg: '#fee2e2' },
  { label: 'Meats', icon: '🥩', bg: '#fee2e2' },
  { label: 'Cooking Oil', icon: '🫒', bg: '#fef3c7' },
  { label: 'Honey', icon: '🍯', bg: '#fefce8' },
  { label: 'Eggs', icon: '🥚', bg: '#fef3c7' },
  { label: 'Others', icon: '🧺', bg: '#f3f4f6' }
];

function asName(product: Product): string {
  return product.name || 'Fresh deal item';
}

function asShop(product: Product): string {
  return product.shopName || 'Local shop';
}

function asWeight(product: Product): string {
  return product.category ? `${product.category} · Fresh` : '500g · Fresh';
}

function savings(product: Product): number {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0;
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}

function expiryDays(product: Product): number {
  if (!product.expiresOn) return 2;
  const diff = new Date(product.expiresOn).getTime() - Date.now();
  if (Number.isNaN(diff)) return 2;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getTimer() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const diff = Math.max(0, end.getTime() - now.getTime());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

export function LandingHome({ shops, products }: Props) {
  const [activeCategory, setActiveCategory] = useState('Vegetables');
  const [timer, setTimer] = useState({ h: 8, m: 42, s: 17 });
  const [added, setAdded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTimer(getTimer());
    const id = window.setInterval(() => setTimer(getTimer()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const featured = products[0];
  const productGrid = useMemo(() => (products.length ? products.slice(0, 4) : []), [products]);
  const nearbyShop = shops[0];

  const onAdd = (id: string) => {
    setAdded((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setAdded((prev) => ({ ...prev, [id]: false }));
    }, 1200);
  };

  return (
    <>
      <section className="hero">
        <div className="hero-noise" />
        <div className="hero-blobs" />
        <div className="hero-content">
          <div className="hero-tags">
            <span className="hero-tag">🥦 Cut food waste</span>
            <span className="hero-tag">🏪 Local shops</span>
            <span className="hero-tag">🔥 Fresh deals</span>
          </div>
          <h1>Save more on <br /><em>fresh food</em></h1>
          <p className="hero-sub">Shop near-expiry deals</p>
          <p>Discover trusted neighborhood shops, buy surplus food at unbeatable prices, and keep good food out of the bin.</p>
          <div className="hero-pills">
            <span className="hero-pill">✓ Save up to 90%</span>
            <span className="hero-pill">✓ Pick up fast</span>
            <span className="hero-pill">✓ Verified sellers</span>
          </div>
          <div className="hero-ctas">
            <Link href="/shops" className="btn-primary">Browse Deals →</Link>
            <button className="btn-secondary" type="button">Find nearby shops</button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card"><h3>2,400+</h3><p>Meals saved weekly</p></div>
          <div className="stat-card"><h3>90%</h3><p>Max savings</p></div>
          <div className="stat-card"><h3>140+</h3><p>Verified shops</p></div>
        </div>
        <div className="scroll-indicator">⌄</div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-track">
          {['🥦 Fresh Vegetables', '🍎 Seasonal Fruits', '🥩 Quality Meats', '🐟 Fresh Seafood', '🌾 Wholegrains', '🧂 Spices & More', '🥦 Fresh Vegetables', '🍎 Seasonal Fruits', '🥩 Quality Meats', '🐟 Fresh Seafood', '🌾 Wholegrains', '🧂 Spices & More'].map((item, idx) => (
            <span key={`${item}-${idx}`} className="marquee-item">{item}<i /></span>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Shop by <span>category</span></h2>
          <Link href="/shops" className="see-all">See all categories</Link>
        </div>
        <div className="cat-grid">
          {categoryItems.map((cat) => (
            <button key={cat.label} className={`cat-card ${activeCategory === cat.label ? 'active' : ''}`} onClick={() => setActiveCategory(cat.label)} type="button">
              <div className="cat-icon" style={{ background: cat.bg }}>{cat.icon}</div>
              <p>{cat.label}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="location-section">
        <div className="location-left">
          <h2>Shop <span style={{ color: 'var(--green)' }}>near you</span></h2>
          <p>Share your location to see nearby shops within minutes. Find trusted sellers with fresh surplus deals right around the corner.</p>
          <div className="location-controls">
            <button className="btn-locate" type="button">Use my location</button>
            <div className="km-selector">5 km radius</div>
          </div>
          <p className="location-found">Found {shops.length} shop{shops.length === 1 ? '' : 's'} near you</p>
          <div className="store-card">
            <div className="store-img">🛒</div>
            <div className="store-info">
              <h4>{nearbyShop?.name || 'Local shop'}</h4>
              <div className="store-addr">{nearbyShop?.address || 'Address unavailable'}</div>
              <div className="store-meta">
                <span className="badge-open">● Open</span>
                <span className="stars">★ {nearbyShop?.rating?.toFixed(1) || '4.6'}</span>
                <span className="store-dist">{nearbyShop?.distanceKm != null ? `${nearbyShop.distanceKm} km away` : 'Distance unavailable'}</span>
              </div>
            </div>
            <Link href={nearbyShop ? `/shops/${nearbyShop.id}` : '/shops'} className="btn-view">View Details →</Link>
          </div>
        </div>
        <div className="map-placeholder">
          <div className="map-pin"><p>📍 {nearbyShop?.name || 'Nearby store'}</p></div>
        </div>
      </div>

      <section className="features-section">
        <div className="features-intro">
          <h2>Why choose bunchfood?</h2>
          <p>We connect you with local shops selling quality food at reduced prices before it goes to waste.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card"><div className="feature-icon" style={{ background: 'rgba(245,166,35,0.15)' }}>💰</div><h3>Shop surplus, save money</h3><p>Find items at dramatically reduced prices as they get closer to expiry.</p></div>
          <div className="feature-card"><div className="feature-icon" style={{ background: 'rgba(76,175,99,0.2)' }}>📍</div><h3>Buy from nearby stores</h3><p>Support small shops and get deliveries or pick-ups faster.</p></div>
          <div className="feature-card"><div className="feature-icon" style={{ background: 'rgba(52,211,153,0.15)' }}>🌱</div><h3>Help reduce waste</h3><p>Every purchase prevents good food from being thrown away.</p></div>
        </div>
      </section>

      <section className="deal-section">
        <div className="section-header">
          <div>
            <p className="deal-label">🔥 Limited picks — updated every morning</p>
            <h2 className="section-title">Deal of the <span>Day</span></h2>
          </div>
        </div>
        <div className="deal-banner">
          <div className="deal-content">
            <div className="deal-badge">🔥 Today only</div>
            <h2>{featured ? asName(featured) : 'Organic Versatile Greens'}</h2>
            <p className="deal-shop">📍 From {featured ? asShop(featured) : 'rockflint · Bolton'}</p>
            <div className="deal-price-row">
              <span className="price-new">£{(featured?.price ?? 0.5).toFixed(2)}</span>
              <span className="price-old">£{(featured?.oldPrice ?? 2).toFixed(2)}</span>
              <span className="discount-tag">{Math.max(savings(featured || { price: 0.5 } as Product), 75)}% OFF</span>
            </div>
            <p className="deal-sub">Best before today · Perfectly fresh · Pick up today</p>
            <p className="deal-exp">⏰ Expires in:</p>
            <div className="deal-timer">
              <div className="timer-block"><span className="t-num">{String(timer.h).padStart(2, '0')}</span><span className="t-label">Hours</span></div>
              <div className="timer-block"><span className="t-num">{String(timer.m).padStart(2, '0')}</span><span className="t-label">Mins</span></div>
              <div className="timer-block"><span className="t-num">{String(timer.s).padStart(2, '0')}</span><span className="t-label">Secs</span></div>
            </div>
            <button className="btn-deal" type="button">Grab this deal</button>
          </div>
          <div className="deal-image-side">
            <div className="deal-product-img">🥬</div>
            <div className="deal-tags"><span className="deal-tag">Organic</span><span className="deal-tag">Near expiry</span><span className="deal-tag">Local shop</span></div>
          </div>
        </div>
      </section>

      <section className="section section-products">
        <div className="section-header">
          <h2 className="section-title">Fresh <span>Vegetables</span></h2>
          <Link href="/shops" className="see-all">Show all</Link>
        </div>
        <div className="products-grid">
          {(productGrid.length ? productGrid : [
            { id: 'a', name: 'Broccoli Crown', price: 0.4, oldPrice: 2, category: '500g · Organic' },
            { id: 'b', name: 'Carrots Bunch', price: 0.45, oldPrice: 1.5, category: '1kg · Fresh' },
            { id: 'c', name: 'Vine Tomatoes', price: 0.2, oldPrice: 2.2, category: '400g · Local' },
            { id: 'd', name: 'Versatile Greens', price: 0.5, oldPrice: 2, category: '500g · Organic' }
          ] as Product[]).map((product, idx) => (
            <div className="product-card" key={product.id || idx}>
              <div className="product-img">{['🥦', '🥕', '🍅', '🥬'][idx % 4]}<span className="expiry-badge">Exp: {expiryDays(product)} days</span><span className="save-badge">Save {Math.max(savings(product), 70)}%</span></div>
              <div className="product-body">
                <p className="product-store">{asShop(product)}</p>
                <p className="product-name">{asName(product)}</p>
                <p className="product-weight">{asWeight(product)}</p>
                <div className="product-footer">
                  <div className="prices"><span className="p-new">£{(product.price ?? 0).toFixed(2)}</span><span className="p-old">£{((product.oldPrice ?? product.price ?? 0) as number).toFixed(2)}</span></div>
                  <button className="add-btn" onClick={() => onAdd(String(product.id || idx))} type="button">{added[String(product.id || idx)] ? '✓' : '+'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}