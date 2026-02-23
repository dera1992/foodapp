import { redirect } from 'next/navigation';
import { AdminProductListPage } from '@/components/admin/products/AdminProductListPage';
import { getSession } from '@/lib/auth/session';
import { getAdminProducts } from '@/lib/api/endpoints';

export default async function AdminProductsPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect('/login');
  }

  const products = await getAdminProducts().then((r) => r.data).catch(() => []);

  return <AdminProductListPage products={products} session={session} />;
}
