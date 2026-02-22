import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHero } from '@/components/layout/PageHero';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getThreads } from '@/lib/api/endpoints';

export default async function MessagesPage() {
  const threads = await getThreads().then((r) => r.data).catch(() => []);

  return (
    <>
      <PageHero title="Messages" subtitle="Stay connected with shops and support." />
      <Container className="py-10">
        {threads.length ? (
          <div className="space-y-3">
            {threads.map((thread) => (
              <Card key={thread.id} className="p-4">
                <Link href={`/messages/${thread.id}`} className="block">
                  <h3 className="text-lg font-semibold text-brand-text">{thread.title}</h3>
                  <p className="mt-1 text-sm text-brand-muted">{thread.lastMessage || 'Open conversation'}</p>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No conversations" description="Start a conversation from any product or shop page." />
        )}
      </Container>
    </>
  );
}