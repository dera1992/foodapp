import Link from 'next/link';
import { StartChatDialog } from '@/components/chat/StartChatDialog';
import { Container } from '@/components/layout/Container';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCurrentUserId, getShop, getShopProducts, getShops, getThreads } from '@/lib/api/endpoints';
import { getSession } from '@/lib/auth/session';

type MessagesPageProps = {
  searchParams?: Promise<{
    shop?: string | string[];
    product?: string | string[];
    ownerInbox?: string | string[];
  }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const shopId = Array.isArray(params?.shop) ? params.shop[0] : params?.shop;
  const productId = Array.isArray(params?.product) ? params.product[0] : params?.product;
  const ownerInbox = Array.isArray(params?.ownerInbox) ? params.ownerInbox[0] : params?.ownerInbox;

  const session = await getSession();

  const [threads, shop, shopProducts, viewerUserId, ownedShopIds] = await Promise.all([
    getThreads().then((r) => r.data).catch(() => []),
    shopId ? getShop(shopId).catch(() => null) : Promise.resolve(null),
    shopId ? getShopProducts(shopId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    getCurrentUserId().catch(() => null),
    session.role === 'shop'
      ? getShops()
          .then((r) => r.data.map((s) => s.id))
          .catch(() => [])
      : Promise.resolve([] as string[]),
  ]);

  const viewerId = viewerUserId != null ? String(viewerUserId) : (session.userId ?? undefined);
  const roleScopedThreads = threads.filter((thread) => {
    if (session.role === 'shop') {
      if (ownedShopIds.length > 0) return Boolean(thread.shopId && ownedShopIds.includes(thread.shopId));
      return Boolean(thread.shopId);
    }

    if ((session.role === 'customer' || session.role === 'dispatcher') && viewerId) {
      const compositeUserId = typeof thread.id === 'string' && thread.id.includes(':') ? thread.id.split(':')[1] : undefined;
      const participantUserId = compositeUserId ?? thread.otherUserId;
      if (!participantUserId) return true;
      return participantUserId !== viewerId;
    }

    return true;
  });

  const scopedThreads =
    session.role === 'shop' && ownerInbox && shopId
      ? roleScopedThreads.filter((thread) => thread.shopId === shopId)
      : roleScopedThreads;

  const showStartComposer = Boolean(shopId) && !(session.role === 'shop' && ownerInbox);

  return (
    <>
      <section className="bg-white py-14">
        <Container>
          <h1 className="text-3xl font-bold tracking-tight text-brand-text md:text-4xl">Messages</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">Stay connected with shops and support.</p>
        </Container>
      </section>
      <Container className="py-10">
        {showStartComposer ? (
          <Card className="mb-4 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-text">Start a new chat</h2>
                <p className="text-sm text-brand-muted">
                  {shop ? `Send a message to ${shop.name}.` : 'Choose a product (optional) and send your message.'}
                </p>
              </div>
              {shop && session.isAuthenticated ? (
                <StartChatDialog
                  autoOpen
                  shopId={shop.id}
                  shopName={shop.name}
                  receiverUserId={shop.ownerUserId}
                  products={shopProducts.data.map((p) => ({ id: p.id, name: p.name }))}
                  defaultProductId={productId}
                  triggerLabel="Open composer"
                />
              ) : shop ? (
                <Link href="/login" className="inline-flex items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
                  Login to chat
                </Link>
              ) : (
                <p className="text-sm text-brand-muted">Shop not found.</p>
              )}
            </div>
          </Card>
        ) : null}
        {session.role === 'shop' && ownerInbox && shop ? (
          <Card className="mb-4 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-brand-text">Inbox for {shop.name}</h2>
                <p className="text-sm text-brand-muted">Customer messages sent to this shop.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-brand-muted">
                {scopedThreads.length} thread{scopedThreads.length === 1 ? '' : 's'}
              </span>
            </div>
          </Card>
        ) : null}
        <Card className="bg-white p-5 sm:p-6">
          {scopedThreads.length ? (
            <div className="space-y-3">
              {scopedThreads.map((thread, index) => {
                const hasCompositeThreadId = typeof thread.id === 'string' && thread.id.includes(':');
                const preferredParticipantId =
                  session.role === 'shop'
                    ? thread.otherUserId
                    : (viewerUserId != null ? String(viewerUserId) : session.userId ?? thread.otherUserId);
                const canonicalThreadId =
                  !hasCompositeThreadId && thread.shopId && preferredParticipantId
                    ? `${thread.shopId}:${preferredParticipantId}`
                    : null;
                const threadHrefId = (hasCompositeThreadId ? thread.id : canonicalThreadId) ?? thread.id;
                const rowKey = thread.id ? String(thread.id) : `thread-${index}`;
                const canOpenThread = Boolean(threadHrefId);
                const isUnread = (thread.unreadCount ?? 0) > 0;
                return (
                <Card key={rowKey} className={isUnread ? 'border-green-200 bg-green-50/40 p-4' : 'bg-white p-4'}>
                  {canOpenThread ? (
                  <Link href={`/messages/${threadHrefId}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-brand-text">{thread.title}</h3>
                        {isUnread ? (
                          <span className="inline-flex rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            New
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-brand-muted">{new Date(thread.updatedAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-brand-muted">{thread.lastMessage || 'Open conversation'}</p>
                    {thread.unreadCount ? (
                      <span className="mt-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                        {thread.unreadCount} new
                      </span>
                    ) : null}
                  </Link>
                  ) : (
                  <div className="block opacity-70">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-brand-text">{thread.title}</h3>
                      <span className="text-xs text-brand-muted">{new Date(thread.updatedAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-brand-muted">{thread.lastMessage || 'Open conversation'}</p>
                    <p className="mt-2 text-xs text-red-600">Thread link unavailable. Refresh and try again.</p>
                  </div>
                  )}
                </Card>
              )})}
            </div>
          ) : (
            <EmptyState
              title="No conversations"
              description={
                session.role === 'shop' && ownerInbox
                  ? 'No customer messages for this shop yet.'
                  : 'Start a conversation from any product or shop page.'
              }
            />
          )}
        </Card>
      </Container>
    </>
  );
}
