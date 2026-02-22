import { formatDate } from '@/lib/utils/format';

export function MessageBubble({ body, isMine, createdAt }: { body: string; isMine?: boolean; createdAt: string }) {
  return (
    <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${isMine ? 'ml-auto bg-brand-primary text-white' : 'bg-white border border-brand-border text-brand-text'}`}>
      <p>{body}</p>
      <p className={`mt-2 text-xs ${isMine ? 'text-green-100' : 'text-brand-muted'}`}>{formatDate(createdAt)}</p>
    </div>
  );
}
