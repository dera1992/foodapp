'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Product, Shop } from '@/types/api';
import { addToCart, addWishlist, getWishlist, removeWishlistByProduct } from '@/lib/api/endpoints';
import { HowItWorksCard } from '@/components/landing/HowItWorksCard';
import { FeatureStrip } from '@/components/landing/FeatureStrip';

type Props = {
  shops: Shop[];
  products: Product[];
};

const categoryItems: Array<{ label: string; icon: string; bg: string }> = [
  { label: 'Vegetables', icon: '\u{1F966}', bg: '#dcfce7' },
  { label: 'Fruits', icon: '\u{1F34E}', bg: '#ffedd5' },
  { label: 'Grains', icon: '\u{1F33E}', bg: '#fef9c3' },
  { label: 'Seafood', icon: '\u{1F41F}', bg: '#dbeafe' },
  { label: 'Spices', icon: '\u{1F336}', bg: '#fee2e2' },
  { label: 'Meats', icon: '\u{1F969}', bg: '#fee2e2' },
  { label: 'Cooking Oil', icon: '\u{1FAD2}', bg: '#fef3c7' },
  { label: 'Honey', icon: '\u{1F36F}', bg: '#fefce8' },
  { label: 'Eggs', icon: '\u{1F95A}', bg: '#fef3c7' },
  { label: 'Others', icon: '\u{1F3EA}', bg: '#f3f4f6' },
];

const MINI_FALLBACK = [
  { id: 'm1', name: 'Sourdough Loaf', price: 1.0 },
  { id: 'm2', name: 'Organic Milk', price: 0.9 },
  { id: 'm3', name: 'Cheddar 300g', price: 1.3 },
  { id: 'm4', name: 'Salad Mix', price: 0.6 },
];

const MINI_ICONS = ['\u{1F35E}', '\u{1F95B}', '\u{1F9C0}', '\u{1F957}'];

function asName(product: Product): string {
  return product.name || 'Fresh deal item';
}

function asShop(product: Product): string {
  return product.shopName || 'Local shop';
}

function asWeight(product: Product): string {
  return product.category ? `${product.category} - Fresh` : '500g - Fresh';
}

function savings(product: Product): number {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0;
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}

function expiryRankDays(product: Product): number {
  if (!product.expiresOn) return Number.MAX_SAFE_INTEGER;
  const diff = new Date(product.expiresOn).getTime() - Date.now();
  if (Number.isNaN(diff)) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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

const RADIUS_OPTIONS = [2, 5, 10, 20] as const;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LandingHome({ shops, products }: Props) {
  const [activeCategory, setActiveCategory] = useState('Vegetables');
  const [timer, setTimer] = useState({ h: 8, m: 42, s: 17 });
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<Record<string, boolean>>({});
  const [radius, setRadius] = useState<number>(5);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [wishlistedIds, setWishlistedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTimer(getTimer());
    const id = window.setInterval(() => setTimer(getTimer()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    getWishlist()
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
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setGeoError('Could not detect your location. Please allow location access.');
        setGeoLoading(false);
      },
      { timeout: 10000 },
    );
  };

  const nearbyShops = useMemo(() => {
    setCarouselIdx(0);
    if (!userCoords) return shops;
    return shops
      .map((shop) => ({
        ...shop,
        distanceKm:
          shop.latitude != null && shop.longitude != null
            ? haversineKm(userCoords.lat, userCoords.lng, shop.latitude, shop.longitude)
            : null,
      }))
      .filter((shop) => shop.distanceKm == null || shop.distanceKm <= radius)
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [shops, userCoords, radius]);

  const carouselShop = nearbyShops[carouselIdx] ?? null;
  const carouselPrev = () => setCarouselIdx((i) => (i - 1 + nearbyShops.length) % nearbyShops.length);
  const carouselNext = () => setCarouselIdx((i) => (i + 1) % nearbyShops.length);

  const rankedDeals = useMemo(() => {
    return [...products].sort((a, b) => {
      const discountDiff = savings(b) - savings(a);
      if (discountDiff !== 0) return discountDiff;

      const expiryDiff = expiryRankDays(a) - expiryRankDays(b);
      if (expiryDiff !== 0) return expiryDiff;

      const priceDiff = (a.price ?? 0) - (b.price ?? 0);
      if (priceDiff !== 0) return priceDiff;

      return String(a.id ?? '').localeCompare(String(b.id ?? ''));
    });
  }, [products]);

  const featured = rankedDeals[0];
  const productGrid = useMemo(() => (rankedDeals.length ? rankedDeals.slice(0, 4) : []), [rankedDeals]);
  const miniProducts = productGrid.slice(0, 4);

  const onAdd = async (id: string) => {
    setAdding((prev) => ({ ...prev, [id]: true }));
    try {
      await addToCart(id, 1);
      setAdded((prev) => ({ ...prev, [id]: true }));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:refresh'));
      window.setTimeout(() => {
        setAdded((prev) => ({ ...prev, [id]: false }));
      }, 1200);
    } catch {
      setAdded((prev) => ({ ...prev, [id]: false }));
    } finally {
      setAdding((prev) => ({ ...prev, [id]: false }));
    }
  };

  const onToggleWishlist = async (productId: string) => {
    const next = !wishlistedIds[productId];
    setWishlistedIds((prev) => ({ ...prev, [productId]: next }));
    try {
      if (next) await addWishlist(productId);
      else await removeWishlistByProduct(productId);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('wishlist:refresh'));
    } catch {
      setWishlistedIds((prev) => ({ ...prev, [productId]: !next }));
    }
  };

  return (
    <>
      {/*  HERO  */}
      <section className="hero">
        <div className="hero-noise" />
        <div className="hero-blobs" />

        <div className="hero-inner">
          {/* LEFT COLUMN */}
          <div className="hero-left">
            <div className="hero-content">
              <div className="hero-tags">
                <span className="hero-tag">{'\u2702\uFE0F'} Cut food waste</span>
                <span className="hero-tag">{'\u{1F4CD}'} Local shops</span>
                <span className="hero-tag">{'\u{1F525}'} Fresh deals</span>
              </div>
              <h1>
                Save more on <br />
                <em>fresh food</em>
              </h1>
              <p className="hero-sub">Shop near-expiry deals</p>
              <p>
                Discover trusted neighborhood shops, buy surplus food at
                unbeatable prices, and keep good food out of the bin.
              </p>
              <div className="hero-pills">
                <span className="hero-pill">{'\u2713'} Save up to 90%</span>
                <span className="hero-pill">{'\u2713'} Pick up fast</span>
                <span className="hero-pill">{'\u2713'} Verified sellers</span>
              </div>
              <div className="hero-ctas">
                <Link href="/products" className="btn-primary">
                  Browse Deals
                </Link>
                <Link href="/shops">
                  <button className="btn-secondary" type="button">
                    Find nearby shops
                  </button>
                </Link>
              </div>
            </div>

            {/* Stats  inline below CTAs */}
            <div className="hero-stats">
              <div className="stat-card">
                <h3>2,400+</h3>
                <p>Meals saved weekly</p>
              </div>
              <div className="stat-divider" />
              <div className="stat-card">
                <h3>90%</h3>
                <p>Max savings</p>
              </div>
              <div className="stat-divider" />
              <div className="stat-card">
                <h3>140+</h3>
                <p>Verified shops</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="hero-right-col">
            <HowItWorksCard />

            {/* Mini product grid  live deal teaser */}
            <div className="mini-grid">
              {(miniProducts.length ? miniProducts : MINI_FALLBACK).map(
                (p, i) => (
                  <Link
                    key={p.id || i}
                    href={p.id ? `/products/${String(p.id)}` : '/products'}
                    className="mini-card"
                  >
                    <div className="mini-emoji">{MINI_ICONS[i % MINI_ICONS.length]}</div>
                    <div>
                      <div className="mini-name">
                        {p.name || MINI_FALLBACK[i]?.name}
                      </div>
                      <div className="mini-price-row">
                        <div className="mini-price">£{(p.price ?? 0).toFixed(2)}</div>
                        {'oldPrice' in p && typeof p.oldPrice === 'number' && p.oldPrice > (p.price ?? 0) ? (
                          <div className="mini-price-old">£{p.oldPrice.toFixed(2)}</div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/*  FEATURE STRIP  */}
      <FeatureStrip />

      {/*  MARQUEE  */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[
            "Fresh Vegetables",
            "Seasonal Fruits",
            "Quality Meats",
            "Fresh Seafood",
            "Wholegrains",
            "Spices & More",
            "Fresh Vegetables",
            "Seasonal Fruits",
            "Quality Meats",
            "Fresh Seafood",
            "Wholegrains",
            "Spices & More",
          ].map((item, idx) => (
            <span key={`${item}-${idx}`} className="marquee-item">
              {item}
              <i />
            </span>
          ))}
        </div>
      </div>

      {/*  SHOP BY CATEGORY  */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            Shop by <span>category</span>
          </h2>
          <Link href="/products" className="see-all">
            See all categories
          </Link>
        </div>
        <div className="cat-grid">
          {categoryItems.map((cat) => (
            <button
              key={cat.label}
              className={`cat-card ${activeCategory === cat.label ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.label)}
              type="button"
            >
              <div className="cat-icon" style={{ background: cat.bg }}>
                {cat.icon}
              </div>
              <p>{cat.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/*  SHOP NEAR YOU  */}
      <div className="location-section">
        <div className="location-left">
          <h2>
            Shop <span style={{ color: "var(--green)" }}>near you</span>
          </h2>
          <p>
            Share your location to see nearby shops within minutes. Find trusted
            sellers with fresh surplus deals right around the corner.
          </p>
          <div className="location-controls">
            <button
              className="btn-locate"
              type="button"
              onClick={handleLocate}
              disabled={geoLoading}
            >
              {geoLoading
                ? "Detecting..."
                : userCoords
                  ? "Location set"
                  : "Use my location"}
            </button>
            <div className="km-select-wrap">
              <select
                className="km-select"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                aria-label="Search radius"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </div>
            <Link href="/shops" className="btn-all-shops">
              All shops
            </Link>
          </div>
          {geoError && <p className="location-error">{geoError}</p>}
          <p className="location-found">
            {userCoords
              ? `Found ${nearbyShops.length} shop${nearbyShops.length === 1 ? "" : "s"} within ${radius} km`
              : `Found ${shops.length} shop${shops.length === 1 ? "" : "s"} near you`}
          </p>

          {carouselShop ? (
            <div className="store-carousel">
              <div className="store-card">
                <div className="store-img">{carouselShop.emoji ?? '\u{1F3EA}'}</div>
                <div className="store-info">
                  <h4>{carouselShop.name}</h4>
                  <div className="store-addr">
                    {carouselShop.city
                      ? `${carouselShop.address ?? ""}, ${carouselShop.city}`
                      : (carouselShop.address ?? "Address unavailable")}
                  </div>
                  <div className="store-meta">
                    <span className="badge-open">{carouselShop.isOpen === false ? 'Closed' : 'Open'}</span>
                    {carouselShop.rating != null && (
                      <span className="stars">Rating {carouselShop.rating.toFixed(1)}</span>
                    )}
                    <span className="store-dist">
                      {" "}
                      {carouselShop.distanceKm != null
                        ? carouselShop.distanceKm < 1
                          ? `${Math.round(carouselShop.distanceKm * 1000)} m away`
                          : `${carouselShop.distanceKm.toFixed(1)} km away`
                        : userCoords
                          ? "Distance unavailable"
                          : "Enable location"}
                    </span>
                  </div>
                </div>
                <Link href={`/shops/${carouselShop.id}`} className="btn-view">
                  View Details
                </Link>
              </div>

              {nearbyShops.length > 1 && (
                <div className="carousel-controls">
                  <button
                    className="carousel-arrow"
                    type="button"
                    onClick={carouselPrev}
                    aria-label="Previous shop"
                  >
                    &#8592;
                  </button>
                  <div className="carousel-dots">
                    {nearbyShops.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`carousel-dot${i === carouselIdx ? " active" : ""}`}
                        onClick={() => setCarouselIdx(i)}
                        aria-label={`Shop ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    className="carousel-arrow"
                    type="button"
                    onClick={carouselNext}
                    aria-label="Next shop"
                  >
                    &#8594;
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="location-empty-msg">
              No shops found within {radius} km. Try a larger radius.
            </p>
          )}
        </div>

        <div className="map-placeholder">
          <div className="map-pin">
            <p>{'\u{1F4CD}'} Nearby: {carouselShop?.name ?? "Nearby store"}</p>
          </div>
        </div>
      </div>

      {/*  WHY CHOOSE BUNCHFOOD  */}
      <section className="features-section">
        <div className="features-intro">
          <h2>Why choose bunchfood?</h2>
          <p>
            We connect you with local shops selling quality food at reduced
            prices before it goes to waste.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div
              className="feature-icon"
              style={{ background: "rgba(245,166,35,0.15)" }}
            >
              {'\u{1F4B0}'}
            </div>
            <h3>Shop surplus, save money</h3>
            <p>
              Find items at dramatically reduced prices as they get closer to
              expiry.
            </p>
          </div>
          <div className="feature-card">
            <div
              className="feature-icon"
              style={{ background: "rgba(76,175,99,0.2)" }}
            >
              {'\u{1F4CD}'}
            </div>
            <h3>Buy from nearby stores</h3>
            <p>Support small shops and get deliveries or pick-ups faster.</p>
          </div>
          <div className="feature-card">
            <div
              className="feature-icon"
              style={{ background: "rgba(52,211,153,0.15)" }}
            >
              {'\u{1F33F}'}
            </div>
            <h3>Help reduce waste</h3>
            <p>Every purchase prevents good food from being thrown away.</p>
          </div>
        </div>
      </section>

      {/*  DEAL OF THE DAY  */}
      <section className="deal-section">
        <div className="section-header">
          <div>
            <p className="deal-label">
              Limited picks - updated every morning
            </p>
            <h2 className="section-title">
              Deal of the <span>Day</span>
            </h2>
          </div>
        </div>
        <div className="deal-banner">
          <div className="deal-content">
            <div className="deal-badge">Today only</div>
            <h2>{featured ? asName(featured) : "Organic Versatile Greens"}</h2>
            <p className="deal-shop">
              From {featured ? asShop(featured) : "rockflint - Bolton"}
            </p>
            <div className="deal-price-row">
              <span className="price-new">
                £{(featured?.price ?? 0.5).toFixed(2)}
              </span>
              <span className="price-old">
                £{(featured?.oldPrice ?? 2).toFixed(2)}
              </span>
              <span className="discount-tag">
                {Math.max(savings(featured || ({ price: 0.5 } as Product)), 75)}
                % OFF
              </span>
            </div>
            <p className="deal-sub">
              Best before today - Perfectly fresh - Pick up today
            </p>
            <p className="deal-exp">Expires in:</p>
            <div className="deal-timer">
              <div className="timer-block">
                <span className="t-num">
                  {String(timer.h).padStart(2, "0")}
                </span>
                <span className="t-label">Hours</span>
              </div>
              <div className="timer-block">
                <span className="t-num">
                  {String(timer.m).padStart(2, "0")}
                </span>
                <span className="t-label">Mins</span>
              </div>
              <div className="timer-block">
                <span className="t-num">
                  {String(timer.s).padStart(2, "0")}
                </span>
                <span className="t-label">Secs</span>
              </div>
            </div>
            <Link
              href={featured?.id ? `/products/${String(featured.id)}` : '/products'}
              className="btn-deal"
            >
              Grab this deal
            </Link>
          </div>
          <div className="deal-image-side">
            <div className="deal-product-img">{'\u{1F96C}'}</div>
            <div className="deal-tags">
              <span className="deal-tag">Organic</span>
              <span className="deal-tag">Near expiry</span>
              <span className="deal-tag">Local shop</span>
            </div>
          </div>
        </div>
      </section>

      {/*  FRESH VEGETABLES  */}
      <section className="section section-products">
        <div className="section-header">
          <h2 className="section-title">
            Fresh <span>Vegetables</span>
          </h2>
          <Link href="/products" className="see-all">
            Show all
          </Link>
        </div>
        <div className="products-grid">
          {(productGrid.length ? productGrid : [
            { id: 'a', name: 'Broccoli Crown', price: 0.4, oldPrice: 2, category: '500g - Organic' },
            { id: 'b', name: 'Carrots Bunch', price: 0.45, oldPrice: 1.5, category: '1kg - Fresh' },
            { id: 'c', name: 'Vine Tomatoes', price: 0.2, oldPrice: 2.2, category: '400g - Local' },
            { id: 'd', name: 'Versatile Greens', price: 0.5, oldPrice: 2, category: '500g - Organic' },
          ] as Product[]).map((product, idx) => (
            <div className="product-card" key={product.id || idx}>
              <Link
                href={product.id ? `/products/${String(product.id)}` : '/products'}
                className="product-img"
                aria-label={`View ${asName(product)}`}
              >
                <button
                  type="button"
                  className="wishlist-card-heart"
                  aria-label="Toggle wishlist"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (productGrid.length && product.id) void onToggleWishlist(String(product.id));
                  }}
                >
                  {wishlistedIds[String(product.id || idx)] ? '\u2665' : '\u2661'}
                </button>
                {['\u{1F966}', '\u{1F955}', '\u{1F345}', '\u{1F96C}'][idx % 4]}
                <span className="expiry-badge">
                  Exp: {expiryDays(product)} days
                </span>
                <span className="save-badge wishlist-save-badge">
                  {savings(product)}% OFF
                </span>
              </Link>
              <div className="product-body">
                <p className="product-store">{asShop(product)}</p>
                <Link href={product.id ? `/products/${String(product.id)}` : '/products'} className="product-name">{asName(product)}</Link>
                <p className="product-weight">{asWeight(product)}</p>
                <div className="product-footer">
                  <div className="prices">
                    <span className="p-new">
                      £{(product.price ?? 0).toFixed(2)}
                    </span>
                    <span className="p-old">
                      £{(
                        (product.oldPrice ?? product.price ?? 0) as number
                      ).toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="add-btn"
                    onClick={() => {
                      if (product.id) void onAdd(String(product.id));
                    }}
                    disabled={!product.id || adding[String(product.id)]}
                    type="button"
                  >
                    {product.id && adding[String(product.id)] ? "..." : added[String(product.id || idx)] ? "OK" : "+"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
