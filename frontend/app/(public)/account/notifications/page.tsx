import { getShopNotifications } from '@/lib/api/endpoints';
import { ShopNotificationsClient } from '@/components/notifications/ShopNotificationsClient';

export default async function NotificationsPage() {
  const notifications = await getShopNotifications().catch(() => []);
  return <ShopNotificationsClient initialNotifications={notifications} />;
}
