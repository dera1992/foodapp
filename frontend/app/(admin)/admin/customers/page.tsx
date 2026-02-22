import { TableCard } from '@/components/analytics/TableCard';
import { getAdminCustomers } from '@/lib/api/endpoints';

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers().then((r) => r.data).catch(() => []);
  return (
    <TableCard title="Customers">
      <table className="min-w-full text-sm">
        <thead><tr className="text-left text-brand-muted"><th className="py-2">Name</th><th>Orders</th><th className="text-right">Spend</th></tr></thead>
        <tbody>{customers.map((customer) => (<tr key={customer.id} className="border-t border-brand-border"><td className="py-2">{customer.name}</td><td>{customer.orders}</td><td className="text-right">£{customer.spend.toFixed(2)}</td></tr>))}</tbody>
      </table>
    </TableCard>
  );
}