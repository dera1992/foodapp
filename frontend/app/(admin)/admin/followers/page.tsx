import { TableCard } from '@/components/analytics/TableCard';
import { getShopFollowers } from '@/lib/api/endpoints';
import { formatDate } from '@/lib/utils/format';

export const metadata = { title: 'Followers – Bunchfood Admin' };

export default async function AdminFollowersPage() {
  const followers = await getShopFollowers().catch(() => []);

  return (
    <TableCard title="Shop Followers">
      {followers.length ? (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-brand-muted">
              <th className="py-2 pr-4">Shop</th>
              <th className="py-2 pr-4">City</th>
              <th className="py-2">Followed Since</th>
            </tr>
          </thead>
          <tbody>
            {followers.map((follower) => (
              <tr key={follower.id} className="border-t border-brand-border">
                <td className="py-2 pr-4 font-medium">{follower.shop_name || follower.shop}</td>
                <td className="py-2 pr-4 text-brand-muted">{follower.shop_city || '–'}</td>
                <td className="py-2 text-brand-muted">
                  {follower.created_at ? formatDate(follower.created_at) : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="py-8 text-center text-sm text-brand-muted">No followers yet.</p>
      )}
    </TableCard>
  );
}
