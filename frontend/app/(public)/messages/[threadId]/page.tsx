import { Container } from '@/components/layout/Container';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ReplyComposer } from '@/components/chat/ReplyComposer';
import { getThread } from '@/lib/api/endpoints';

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const payload = await getThread(threadId).catch(() => null);

  if (!payload) {
    return <Container className="py-10"><p className="text-sm text-brand-muted">Thread not found.</p></Container>;
  }

  return (
    <Container className="space-y-4 py-10">
      <ChatHeader thread={payload.thread} />
      <div className="space-y-3 rounded-2xl border border-brand-border bg-slate-50 p-4">
        {payload.messages.map((message) => (
          <MessageBubble key={message.id} body={message.body} isMine={message.isMine} createdAt={message.createdAt} />
        ))}
      </div>
      <ReplyComposer />
    </Container>
  );
}