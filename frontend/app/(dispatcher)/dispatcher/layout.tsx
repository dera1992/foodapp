import { getMyDispatcherProfile } from '@/lib/api/endpoints';
import { DispatcherPortalLayout } from '@/components/dispatcher-portal/DispatcherPortalLayout';

export default async function DispatcherLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyDispatcherProfile().catch(() => null);

  const name = profile?.full_name ?? 'Dispatcher';
  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DispatcherPortalLayout name={name} initials={initials}>
      {children}
    </DispatcherPortalLayout>
  );
}
