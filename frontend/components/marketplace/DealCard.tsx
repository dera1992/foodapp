import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PriceBlock } from './PriceBlock';
import type { Product } from '@/types/api';

export function DealCard({ product }: { product: Product }) {
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  return (
    <Card className="overflow-hidden border-brand-primary/20 bg-gradient-to-r from-brand-primaryLight/50 to-white">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative h-64">
          <Image src={product.image || '/placeholder-product.svg'} alt={product.name} fill className="object-cover" />
        </div>
        <div className="flex flex-col justify-center gap-4 p-6">
          <div className="flex items-center justify-between">
            <Badge>{discount ? `${discount}% off` : 'Deal'}</Badge>
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-warning">Limited time</span>
          </div>
          <h3 className="text-2xl font-semibold text-brand-text">{product.name}</h3>
          <PriceBlock price={product.price} oldPrice={product.oldPrice ?? undefined} />
          <Button className="w-fit">Add to cart</Button>
        </div>
      </div>
    </Card>
  );
}
