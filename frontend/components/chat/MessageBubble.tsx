import Link from 'next/link';
import { getProductPath } from '@/lib/products';
import { formatDate } from '@/lib/utils/format';

export function MessageBubble({
  body,
  isMine,
  createdAt,
  productName,
  productId,
}: {
  body: string;
  isMine?: boolean;
  createdAt: string;
  productId?: string;
  productName?: string;
}) {
  return (
    <div
      className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${
        isMine ? 'ml-auto border border-green-200 bg-green-100 text-black' : 'border border-brand-border bg-white text-black'
      }`}
    >
      {productName ? (
        productId ? (
          <Link
            href={getProductPath({ id: productId, name: productName })}
            className={`mb-2 inline-flex rounded-full px-2 py-1 text-xs underline-offset-2 hover:underline ${
              isMine ? 'border border-green-200 bg-white text-black' : 'bg-sky-50 text-black'
            }`}
          >
            Product: {productName}
          </Link>
        ) : (
          <p
            className={`mb-2 inline-flex rounded-full px-2 py-1 text-xs ${
              isMine ? 'border border-green-200 bg-white text-black' : 'bg-sky-50 text-black'
            }`}
          >
            Product: {productName}
          </p>
        )
      ) : null}
      <p>{body}</p>
      <p className="mt-2 text-xs text-black">{formatDate(createdAt)}</p>
    </div>
  );
}
