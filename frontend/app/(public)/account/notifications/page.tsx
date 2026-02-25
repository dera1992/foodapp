import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getShopNotifications } from '@/lib/api/endpoints';
import { Container } from '@/components/layout/Container';
import { ShopNotificationsClient } from '@/components/notifications/ShopNotificationsClient';

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/login');
  }

  const notifications = await getShopNotifications().catch(() => []);

  return (
    <div className="bf-analytics-page-wrap py-10">
      <Container>
        <ShopNotificationsClient initialNotifications={notifications} />
      </Container>
    </div>
  );
}
