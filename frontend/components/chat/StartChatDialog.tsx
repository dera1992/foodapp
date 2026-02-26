'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError } from '@/lib/api/client';
import { sendReply } from '@/lib/api/endpoints';

type StartChatDialogProps = {
  shopId: string;
  receiverUserId?: string;
  shopName: string;
  products?: Array<{ id: string; name: string }>;
  triggerLabel?: string;
  triggerClassName?: string;
  compact?: boolean;
  defaultProductId?: string;
  autoOpen?: boolean;
  showTrigger?: boolean;
};

export function StartChatDialog({
  shopId,
  receiverUserId,
  shopName,
  products = [],
  triggerLabel = 'Start chat',
  triggerClassName,
  compact = false,
  defaultProductId,
  autoOpen = false,
  showTrigger = true
}: StartChatDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [productId, setProductId] = useState(defaultProductId ?? '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const didAutoOpenRef = useRef(false);

  const canSend = !!receiverUserId && message.trim() && !loading;

  useEffect(() => {
    if (!autoOpen || didAutoOpenRef.current) return;
    didAutoOpenRef.current = true;
    if (defaultProductId) setProductId(defaultProductId);
    setOpen(true);
  }, [autoOpen, defaultProductId]);

  const resetAndClose = () => {
    setOpen(false);
    setFeedback(null);
  };

  const onSend = async () => {
    if (!receiverUserId || !message.trim() || loading) return;
    setLoading(true);
    setFeedback(null);
    const threadId = `${shopId}:${receiverUserId}`;
    try {
      await sendReply(threadId, message.trim(), { productId: productId || undefined });
      setMessage('');
      setProductId(defaultProductId ?? '');
      setOpen(false);
      router.push(`/messages/${threadId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFeedback('Please sign in to start a chat.');
      } else {
        setFeedback('Could not send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          className={triggerClassName ?? (compact ? 'inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm font-medium text-brand-text' : 'inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white')}
          onClick={() => {
            if (defaultProductId) setProductId(defaultProductId);
            setOpen(true);
          }}
          disabled={!receiverUserId}
          title={!receiverUserId ? 'Chat is unavailable for this shop right now.' : undefined}
        >
          <MessageSquare className="h-4 w-4" />
          {triggerLabel}
        </button>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-brand-text">Chat with {shopName}</h3>
                <p className="text-xs text-brand-muted">Ask about stock, pickup, or product details.</p>
              </div>
              <button type="button" onClick={resetAndClose} className="rounded-lg p-2 text-brand-muted hover:bg-slate-100" aria-label="Close chat dialog">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div>
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

              <div>
                <label className="mb-1 block text-sm font-medium text-brand-text">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message..."
                  disabled={loading}
                  rows={4}
                />
              </div>

              {!receiverUserId ? (
                <p className="text-sm text-brand-muted">Chat is unavailable for this shop right now.</p>
              ) : null}
              {feedback ? <p className="text-sm text-brand-muted">{feedback}</p> : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-brand-border px-4 py-3">
              <Button type="button" variant="ghost" onClick={resetAndClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="min-w-[120px] bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
                onClick={onSend}
                disabled={!canSend}
              >
                {loading ? 'Sending...' : 'Send message'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
