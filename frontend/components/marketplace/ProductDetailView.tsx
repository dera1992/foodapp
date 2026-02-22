'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { ArrowRight, Bell, Building2, Clock3, Copy, Facebook, Heart, MessageCircle, ShoppingCart, Star } from 'lucide-react';
import type { Product } from '@/types/api';
import { addToCart } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/money';
import { formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/Button';
import { QuantityControl } from '@/components/marketplace/QuantityControl';
import { ProductTabs } from '@/components/marketplace/ProductTabs';
import { ProductCard } from '@/components/marketplace/ProductCard';

type ProductDetailViewProps = {
  product: Product;
  related: Product[];
};

export function ProductDetailView({ product, related }: ProductDetailViewProps) {
  const [selectedImage, setSelectedImage] = useState(product.image || '/placeholder-product.svg');
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    setIsShareSupported(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const gallery = useMemo(() => {
    const images = [product.image, ...(product.gallery || [])].filter(Boolean) as string[];
    return images.length ? Array.from(new Set(images)) : ['/placeholder-product.svg'];
  }, [product.gallery, product.image]);

  const discount = product.oldPrice && product.oldPrice > product.price ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;
  const reviewCount = product.reviewCount || 0;
  const filledStars = Math.max(0, Math.min(5, Math.round(product.rating ?? 0)));
  const categories = product.categories?.length ? product.categories : product.category ? [product.category] : [];

  const onAddToCart = () => {
    setNotice(null);
    startTransition(async () => {
      try {
        await addToCart(product.id, qty);
        setNotice('Added to cart.');
      } catch {
        setNotice('Could not add to cart right now.');
      }
    });
  };

  return (
    <>
      <section className="bf-product-main-card">
        <div className="bf-product-main-grid">
          <div>
            <div className="bf-product-image-frame">
              <div className="bf-product-image-badges">
                {product.status && product.status.toLowerCase() === 'draft' ? <span className="bf-status-badge is-draft">Draft</span> : null}
                {product.delivery ? <span className="bf-status-badge is-delivery">{product.delivery}</span> : null}
              </div>
              <Image src={selectedImage} alt={product.name} fill className="object-cover" />
            </div>
            <div className="bf-thumb-row">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`bf-thumb-btn ${selectedImage === image ? 'is-active' : ''}`}
                  aria-label="Select product image"
                >
                  <Image src={image} alt={product.name} width={72} height={72} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h1 className="bf-product-title">{product.name}</h1>
            <div className="bf-rating-row">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={`rating-${index}`} className={`h-4 w-4 ${index < filledStars ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span>({reviewCount})</span>
            </div>
            <div className="bf-price-row">
              <span className="bf-price-new">{formatCurrency(product.price)}</span>
              {product.oldPrice ? <span className="bf-price-old">{formatCurrency(product.oldPrice)}</span> : null}
              {discount ? <span className="bf-discount-badge">{discount}% OFF</span> : null}
            </div>
            <p className="bf-short-desc">{product.shortDescription || product.description || 'Fresh deal from a verified local shop.'}</p>
            {product.expiresOn ? (
              <p className="bf-expiry-callout">
                <Clock3 className="inline h-4 w-4" /> Best before: <strong>{formatDate(product.expiresOn)}</strong> - Pick up today for maximum freshness.
              </p>
            ) : null}
            <div className="bf-cta-row">
              <QuantityControl value={qty} onChange={setQty} />
              <Button className="flex-1" onClick={onAddToCart} disabled={isPending}>
                <ShoppingCart className="mr-1 h-4 w-4" />
                {isPending ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
            <button type="button" className={`bf-wishlist-btn ${wishlisted ? 'wishlisted' : ''}`} onClick={() => setWishlisted((prev) => !prev)}>
              <Heart className="h-4 w-4" />
              Add to Wishlist
            </button>
            <hr className="bf-product-divider" />
            <button type="button" className="bf-subscribe-btn" disabled={!product.shopId}>
              <Bell className="h-4 w-4" />
              Subscribe to Store
            </button>
            {!product.shopId ? <p className="mt-2 text-xs text-brand-muted">Store subscription is unavailable for this product.</p> : null}
            {notice ? <p className="mt-3 text-sm text-brand-muted">{notice}</p> : null}
            {categories.length ? (
              <>
                <hr className="bf-product-divider" />
                <div className="bf-meta-row">
                  <span className="bf-meta-label">Categories:</span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <span key={category} className="bf-category-pill">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
            <hr className="bf-product-divider" />
            <div className="bf-meta-row">
              <span className="bf-meta-label">Share this product</span>
              <div className="bf-share-row">
                <button type="button" aria-label="Share on Facebook" className="bf-share-btn is-facebook" disabled title="Social sharing coming soon">
                  <Facebook className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Share on WhatsApp" className="bf-share-btn is-whatsapp" disabled title="Social sharing coming soon">
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Copy product link"
                  className="bf-share-btn is-copy"
                  onClick={() => {
                    if (typeof window === 'undefined') return;
                    navigator.clipboard?.writeText(window.location.href);
                    setNotice('Product link copied.');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Share product"
                  className="bf-share-btn is-twitter"
                  onClick={() => {
                    if (!isShareSupported || typeof window === 'undefined') return;
                    navigator.share?.({ title: product.name, text: product.shortDescription || product.name, url: window.location.href });
                  }}
                  disabled={!isShareSupported}
                  title={isShareSupported ? 'Share product' : 'Native share not supported'}
                >
                  x
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductTabs description={product.description} />

      <section className="bf-product-related">
        <div className="bf-related-head">
          <h2>
            Related <span>Products</span>
          </h2>
          <Link href="/shops">See all</Link>
        </div>
        {related.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <div className="bf-related-empty">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primaryLight text-brand-primaryDark">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <h3>No related products found</h3>
            <p>Browse all available fresh deals.</p>
            <Link href="/shops" className="bf-related-empty-link">
              Browse all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="partners-wrap !mb-16 !mt-12">
        <div className="partners-header">
          <div>
            <h2>
              Our Affiliate <span>Partners</span>
            </h2>
            <p>Brands and organisations we work with.</p>
          </div>
          <a href="#" className="partners-btn inline-flex items-center gap-2">
            Become a partner <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="partners-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`partner-${index}`} className="partner-card">
              <div className="partner-icon">
                <Building2 className="h-5 w-5" />
              </div>
              <p>Partner Name</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}