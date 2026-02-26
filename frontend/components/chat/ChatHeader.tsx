import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Thread } from '@/types/api';

export function ChatHeader({ thread }: { thread: Thread }) {
  const [title, subtitle] = thread.title.split(' - ');

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-black">
            <Mail className="h-3.5 w-3.5" />
            Thread
          </div>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-black sm:text-3xl">{title || thread.title}</h2>
          <p className="mt-1 text-base text-black/80">{subtitle ? `Chatting with ${subtitle}` : 'Conversation details'}</p>
          <p className="mt-2 text-sm text-black">Updated {new Date(thread.updatedAt).toLocaleString()}</p>
        </div>

        <Link
          href="/messages"
          className="inline-flex items-center justify-center rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-50"
        >
          Back to inbox
        </Link>
      </div>
    </div>
  );
}
