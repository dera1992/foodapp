'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/api';
import { formatCurrency } from '@/lib/utils/money';

type DealTimer = { hours: number; mins: number; secs: number };

function getTimeLeftToEndOfDay(): DealTimer {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = Math.max(0, end.getTime() - now.getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, mins, secs };
}

export function DealOfDayShowcase({ product }: { product: Product | null | undefined }) {
  const [time, setTime] = useState<DealTimer | null>(null);

  useEffect(() => {
    setTime(getTimeLeftToEndOfDay());
    const id = window.setInterval(() => setTime(getTimeLeftToEndOfDay()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const discount = useMemo(() => {
    if (!product?.oldPrice || product.oldPrice <= product.price) return null;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }, [product]);

  return (
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a4d24] to-[#2d7a3a]">
      <div className="grid min-h-[360px] gap-0 lg:grid-cols-[1fr_420px]">
        <div className="p-8 md:p-12">
          <span className="inline-flex rounded-full bg-amber-200/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">🔥 Today only</span>
          <h3 className="mt-4 font-serif text-4xl font-black text-white">{product?.name ?? 'Fresh Deal Bundle'}</h3>
          <p className="mt-2 text-sm text-green-200">📍 {product?.shopName ?? 'Local partner shop'}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="font-serif text-5xl font-black text-white">{formatCurrency(product?.price ?? 4.5)}</span>
            {product?.oldPrice ? <span className="text-lg text-white/50 line-through">{formatCurrency(product.oldPrice)}</span> : null}
            {discount ? <span className="rounded-full border border-amber-300/40 bg-amber-200/20 px-3 py-1 text-sm font-semibold text-amber-200">Save {discount}%</span> : null}
          </div>
          <p className="mt-2 text-sm text-white/70">Best before: {product?.expiresOn ?? 'Today'}</p>

          <div className="mt-6 flex items-center gap-2 text-white/90">
            <span className="text-sm font-semibold">⏰ Expires in:</span>
            {[
              { key: 'h', value: time?.hours, label: 'Hours' },
              { key: 'm', value: time?.mins, label: 'Mins' },
              { key: 's', value: time?.secs, label: 'Secs' }
            ].map((item) => (
              <div key={item.key} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center">
                <div className="font-serif text-xl font-bold text-white">{item.value == null ? '--' : String(item.value).padStart(2, '0')}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/70">{item.label}</div>
              </div>
            ))}
          </div>

          <button className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1a4d24] transition hover:-translate-y-0.5 hover:shadow-lg">
            <ShoppingCart className="h-4 w-4" />
            Grab this deal
          </button>
        </div>

        <div className="relative flex items-center justify-center bg-gradient-to-br from-white/10 to-black/10">
          <div className="deal-float text-8xl">🥬</div>
          <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium text-white">Organic</span>
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium text-white">Near expiry</span>
          </div>
        </div>
      </div>
    </section>
  );
}