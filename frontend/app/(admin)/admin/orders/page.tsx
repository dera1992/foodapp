import { redirect } from 'next/navigation';
import { OrderStatusDashboardPage } from '@/components/orders/OrderStatusDashboardPage';
import { getSession } from '@/lib/auth/session';
import { getAdminOrders, getShopOrders } from '@/lib/api/endpoints';
import { normalizeOrderStatusRows } from '@/lib/orders/normalizeOrderStatusRows';

export default async function AdminOrdersPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/login');
  }

  const isShop = session.role === 'shop';
  const scope = isShop ? 'shop' : 'admin';

  const payload = isShop
    ? await getShopOrders().catch(() => ({ data: [] as unknown[] }))
    : await getAdminOrders().catch(() => ({ data: [] as unknown[] }));

  const orders = normalizeOrderStatusRows(payload.data as unknown[], session, scope);

  return <OrderStatusDashboardPage orders={orders} scope={scope} />;
}
