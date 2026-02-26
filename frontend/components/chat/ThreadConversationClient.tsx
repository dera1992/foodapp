'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ReplyComposer } from '@/components/chat/ReplyComposer';
import { deleteChatMessage, getThreadMessages, patchChatMessage } from '@/lib/api/endpoints';
import type { Message } from '@/types/api';

type ThreadConversationClientProps = {
  threadId: string;
  initialMessages: Message[];
  products?: Array<{ id: string; name: string }>;
};

export function ThreadConversationClient({
  threadId,
  initialMessages,
  products = []
}: ThreadConversationClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const lastIdRef = useRef<string>(initialMessages.at(-1)?.id ?? '');
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    lastIdRef.current = messages.at(-1)?.id ?? '';
  }, [messages]);

  useEffect(() => {
    window.dispatchEvent(new Event('chat:refresh-unread'));
  }, [threadId]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const next = await getThreadMessages(threadId, lastIdRef.current || undefined);
        if (!active || !next.length) return;
        setMessages((current) => {
          const seen = new Set(current.map((m) => m.id));
          const merged = [...current];
          for (const item of next) {
            if (item.id && seen.has(item.id)) continue;
            merged.push(item);
            if (item.id) seen.add(item.id);
          }
          return merged;
        });
        if (next.some((item) => !item.isMine)) {
          setNotice('New message received.');
          if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
          noticeTimerRef.current = window.setTimeout(() => setNotice(null), 3000);
        }
      } catch {
        // Keep polling silent to match the old Django template behavior.
      }
    };

    const intervalId = window.setInterval(poll, 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, [threadId]);

  const beginEdit = (message: Message) => {
    setEditingId(message.id);
    setEditingBody(message.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingBody('');
  };

  const saveEdit = async (id: string) => {
    const body = editingBody.trim();
    if (!body) return;
    const prev = messages;
    setMessages((current) => current.map((m) => (m.id === id ? { ...m, body } : m)));
    cancelEdit();
    try {
      await patchChatMessage(id, { content: body });
      window.dispatchEvent(new Event('chat:refresh-unread'));
      setNotice('Message updated.');
    } catch {
      setMessages(prev);
      setNotice('Could not update message.');
    }
  };

  const onDelete = async (id: string) => {
    const prev = messages;
    setMessages((current) => current.filter((m) => m.id !== id));
    try {
      await deleteChatMessage(id);
      window.dispatchEvent(new Event('chat:refresh-unread'));
      setNotice('Message deleted.');
    } catch {
      setMessages(prev);
      setNotice('Could not delete message.');
    }
  };

  return (
    <>
      {notice ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{notice}</div>
      ) : null}

      <div className="space-y-3 rounded-2xl border border-brand-border bg-white p-4">
        {messages.length ? (
          messages.map((message) => (
            <div key={message.id}>
              {editingId === message.id ? (
                <div className="ml-auto max-w-xl rounded-2xl border border-brand-border bg-white p-3">
                  <textarea
                    className="w-full rounded-lg border border-brand-border p-2 text-sm text-brand-text"
                    rows={3}
                    value={editingBody}
                    onChange={(e) => setEditingBody(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" className="rounded-lg border border-brand-border p-2" onClick={cancelEdit} aria-label="Cancel edit">
                      <X className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-lg bg-brand-primary p-2 text-white" onClick={() => saveEdit(message.id)} aria-label="Save edit">
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <MessageBubble
                    body={message.body}
                    productId={message.productId}
                    productName={message.productName}
                    isMine={message.isMine}
                    createdAt={message.createdAt}
                  />
                  {message.isMine ? (
                    <div className="mt-1 flex justify-end gap-2">
                      <button type="button" className="rounded-lg border border-brand-border bg-white p-2 text-brand-muted" onClick={() => beginEdit(message)} aria-label="Edit message">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded-lg border border-brand-border bg-white p-2 text-red-600" onClick={() => onDelete(message.id)} aria-label="Delete message">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-brand-muted">No messages yet. Start the conversation below.</p>
        )}
      </div>

      <ReplyComposer
        threadId={threadId}
        products={products}
        onSent={(message) => {
          setMessages((current) => [...current, message]);
          window.dispatchEvent(new Event('chat:refresh-unread'));
        }}
      />
    </>
  );
}
