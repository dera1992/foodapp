import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriceBlock } from './PriceBlock';
import type { Product } from '@/types/api';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/products/${product.id}`} className="relative block h-44 bg-brand-primaryLight/40">
        <Image src={product.image || '/placeholder-product.svg'} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
      </Link>
      <div className="space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{product.category || 'Fresh deal'}</p>
        <h3 className="line-clamp-2 text-lg font-semibold text-brand-text">{product.name}</h3>
        <PriceBlock price={product.price} oldPrice={product.oldPrice ?? undefined} />
        <div className="flex gap-2">
          <Button className="flex-1">Add to cart</Button>
          <Button variant="ghost" className="px-3" aria-label="Add to wishlist">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
