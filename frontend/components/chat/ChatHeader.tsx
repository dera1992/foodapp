import { Thread } from '@/types/api';

export function ChatHeader({ thread }: { thread: Thread }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white px-4 py-3">
      <h2 className="text-lg font-semibold text-brand-text">{thread.title}</h2>
      <p className="text-sm text-brand-muted">Updated {new Date(thread.updatedAt).toLocaleString()}</p>
    </div>
  );
}
