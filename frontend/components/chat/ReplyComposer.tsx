'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError } from '@/lib/api/client';
import { sendReply } from '@/lib/api/endpoints';
import type { Message } from '@/types/api';

type ReplyComposerProps = {
  threadId: string;
  products?: Array<{ id: string; name: string }>;
  onSent?: (message: Message) => void;
};

export function ReplyComposer({ threadId, products = [], onSent }: ReplyComposerProps) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onSend = async () => {
    if (!value.trim() || loading) return;
    setLoading(true);
    setFeedback(null);
    try {
      const selectedProduct = products.find((product) => product.id === productId);
      const next = await sendReply(threadId, value.trim(), { productId: productId || undefined });
      setValue('');
      setProductId('');
      setFeedback('Reply sent.');
      onSent?.({
        ...next,
        productId: next.productId ?? (selectedProduct ? selectedProduct.id : undefined),
        productName: next.productName ?? (selectedProduct ? selectedProduct.name : undefined),
      });
      if (!onSent) router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFeedback('Please sign in to send messages.');
      } else {
        setFeedback('Could not send reply. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4">
      {products.length ? (
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-brand-text">Product (optional)</label>
          <Select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={loading}>
            <option value="">General question</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write your reply" disabled={loading} />
      {feedback ? <p className="mt-2 text-sm text-brand-muted">{feedback}</p> : null}
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          onClick={onSend}
          disabled={loading || !value.trim()}
          className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
        >
          {loading ? 'Sending...' : 'Send reply'}
        </Button>
      </div>
    </div>
  );
}
