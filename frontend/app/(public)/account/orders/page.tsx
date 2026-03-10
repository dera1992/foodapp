import { getSession } from '@/lib/auth/session';
import { getUserOrders } from '@/lib/api/endpoints';
import { normalizeOrderStatusRows } from '@/lib/orders/normalizeOrderStatusRows';
import { OrderStatusDashboardPage } from '@/components/orders/OrderStatusDashboardPage';

export default async function AccountOrdersPage() {
  const session = await getSession();
  const payload = await getUserOrders().catch(() => ({ data: [] as unknown[] }));
  const orders = normalizeOrderStatusRows(payload.data as unknown[], session, 'customer');

  return <OrderStatusDashboardPage orders={orders} scope="customer" />;
}
