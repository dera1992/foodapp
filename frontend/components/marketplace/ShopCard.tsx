import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Shop } from '@/types/api';

export function ShopCard({ shop }: { shop: Shop }) {
  const distanceLabel = shop.distanceKm != null ? `${shop.distanceKm.toFixed(1)} km away` : 'Distance unavailable';
  const ratingLabel = shop.rating ? `★ ${shop.rating.toFixed(1)}` : '★ 4.6';
  const statusOpen = shop.isOpen !== false;

  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 bg-gradient-to-br from-brand-primaryLight to-white">
        <Image
          src={shop.image || '/placeholder-shop.svg'}
          alt={shop.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <Badge className="absolute left-3 top-3">{distanceLabel}</Badge>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-text">{shop.name}</h3>
          <p className="text-sm text-brand-muted">
            {shop.address || 'Address unavailable'} {shop.city ? `, ${shop.city}` : ''}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${
                statusOpen
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {statusOpen ? 'Open now' : 'Closed'}
            </span>
            {shop.openingHours ? <span className="text-xs text-brand-muted">{shop.openingHours}</span> : null}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-brand-primaryDark">{ratingLabel}</span>
          <Link
            href={`/shops/${shop.id}`}
            className="rounded-xl border border-brand-border px-3 py-2 text-sm font-medium text-brand-text hover:bg-slate-50"
          >
            View details
          </Link>
        </div>
      </div>
    </Card>
  );
}
