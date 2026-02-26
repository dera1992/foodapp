import { Container } from '@/components/layout/Container';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ThreadConversationClient } from '@/components/chat/ThreadConversationClient';
import { Card } from '@/components/ui/Card';
import { getShopProducts, getThread } from '@/lib/api/endpoints';

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const payload = await getThread(threadId).catch(() => null);

  if (!payload) {
    return (
      <Container className="py-10">
        <Card className="bg-white p-4">
          <p className="text-sm text-brand-muted">Thread not found.</p>
        </Card>
      </Container>
    );
  }

  const effectiveThreadId = payload.thread.id || threadId;
  const compositeShopId =
    payload.thread.shopId ??
    (effectiveThreadId.includes(':') ? effectiveThreadId.split(':')[0] : undefined);
  const shouldLoadProducts = Boolean(compositeShopId && /^\d+$/.test(compositeShopId));
  const productsResult = shouldLoadProducts
    ? await getShopProducts(String(compositeShopId)).catch(() => ({ data: [] }))
    : { data: [] };

  return (
    <Container className="space-y-4 py-10">
      <ChatHeader thread={payload.thread} />
      <ThreadConversationClient
        threadId={effectiveThreadId}
        initialMessages={payload.messages}
        products={productsResult.data.map((product) => ({ id: product.id, name: product.name }))}
      />
    </Container>
  );
}
