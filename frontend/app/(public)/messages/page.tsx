import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getThreads } from '@/lib/api/endpoints';

export default async function MessagesPage() {
  const threads = await getThreads().then((r) => r.data).catch(() => []);

  return (
    <>
      <section className="bg-white py-14">
        <Container>
          <h1 className="text-3xl font-bold tracking-tight text-brand-text md:text-4xl">Messages</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-brand-muted">Stay connected with shops and support.</p>
        </Container>
      </section>
      <Container className="py-10">
        <Card className="bg-white p-5 sm:p-6">
          {threads.length ? (
            <div className="space-y-3">
              {threads.map((thread) => (
                <Card key={thread.id} className="bg-white p-4">
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
        </Card>
      </Container>
    </>
  );
}
