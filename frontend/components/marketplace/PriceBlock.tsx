import { formatCurrency } from '@/lib/utils/money';

export function PriceBlock({ price, oldPrice }: { price: number; oldPrice?: number }) {
  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-brand-primaryDark">{formatCurrency(price)}</span>
      {oldPrice ? <span className="text-sm text-brand-muted line-through">{formatCurrency(oldPrice)}</span> : null}
      {discount ? <span className="rounded-full bg-brand-primaryLight px-2 py-1 text-xs font-semibold text-brand-primaryDark">-{discount}%</span> : null}
    </div>
  );
}
