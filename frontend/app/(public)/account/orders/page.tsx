import { redirect } from 'next/navigation';
import { OrderStatusDashboardPage } from '@/components/orders/OrderStatusDashboardPage';
import { Container } from '@/components/layout/Container';
import { getSession } from '@/lib/auth/session';
import { getAdminOrders } from '@/lib/api/endpoints';
import { normalizeOrderStatusRows } from '@/lib/orders/normalizeOrderStatusRows';

export default async function AccountOrdersPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/login');
  }

  const payload = await getAdminOrders().catch(() => ({ data: [] as unknown[] }));
  const orders = normalizeOrderStatusRows(payload.data as unknown[], session, 'customer');

  return (
    <div className="bf-analytics-page-wrap py-10">
      <Container>
        <OrderStatusDashboardPage orders={orders} scope="customer" />
      </Container>
    </div>
  );
}
