import Image from 'next/image';

export function ProductGallery({ images }: { images?: string[] }) {
  const source = images?.length ? images : ['/placeholder-product.svg'];
  return (
    <div className="space-y-3">
      <div className="relative h-80 overflow-hidden rounded-2xl border border-brand-border bg-white">
        <Image src={source[0]} alt="Product" fill className="object-cover" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {source.slice(0, 4).map((img, idx) => (
          <div key={`${img}-${idx}`} className="relative h-20 overflow-hidden rounded-xl border border-brand-border bg-white">
            <Image src={img} alt={`Product preview ${idx + 1}`} fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
