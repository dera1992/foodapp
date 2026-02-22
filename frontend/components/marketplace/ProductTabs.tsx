'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/format';

type ProductReview = {
  id: string;
  author: string;
  createdAt: string;
  rating: number;
  body: string;
};

type ProductTabsProps = {
  description?: string;
  reviews?: ProductReview[];
};

export function ProductTabs({ description, reviews = [] }: ProductTabsProps) {
  const [active, setActive] = useState<'description' | 'reviews'>('description');

  return (
    <section className="bf-product-tabs-card">
      <div className="bf-product-tabs-header">
        <button type="button" className={`bf-product-tab ${active === 'description' ? 'active' : ''}`} onClick={() => setActive('description')}>
          Description
        </button>
        <button type="button" className={`bf-product-tab ${active === 'reviews' ? 'active' : ''}`} onClick={() => setActive('reviews')}>
          Reviews ({reviews.length})
        </button>
      </div>
      <div className="bf-product-tab-panel">
        {active === 'description' ? (
          <p>{description || 'No description has been added for this product yet.'}</p>
        ) : reviews.length === 0 ? (
          <div className="bf-reviews-empty">
            <Star className="h-10 w-10 text-brand-border" />
            <h3>No reviews yet</h3>
            <p>Be the first to review this product.</p>
            <Button className="mt-4">Write a Review</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="bf-review-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4>{review.author}</h4>
                    <p>{formatDate(review.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={`${review.id}-${index}`} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-3">{review.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>
      {/* TODO: Wire reviews to a dedicated reviews endpoint when available in API mapping. */}
    </section>
  );
}