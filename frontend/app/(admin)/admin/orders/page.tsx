import { TableCard } from '@/components/analytics/TableCard';
import { getAdminOrders } from '@/lib/api/endpoints';

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders().then((r) => r.data).catch(() => []);
  return (
    <TableCard title="Orders">
      <table className="min-w-full text-sm">
        <thead><tr className="text-left text-brand-muted"><th className="py-2">Order</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr></thead>
        <tbody>{orders.map((order) => (<tr key={order.id} className="border-t border-brand-border"><td className="py-2">{order.id}</td><td>{order.customer}</td><td>{order.status}</td><td className="text-right">£{order.total.toFixed(2)}</td></tr>))}</tbody>
      </table>
    </TableCard>
  );
}