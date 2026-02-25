import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getAdminUsers } from '@/lib/api/endpoints';
import { UsersAdminClient } from './UsersAdminClient';

export const metadata = { title: 'Manage Users – Bunchfood Admin' };

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session.isAuthenticated) redirect('/login');

  const users = await getAdminUsers().catch(() => []);

  return (
    <div className="p-6">
      <UsersAdminClient initialUsers={users} />
    </div>
  );
}
