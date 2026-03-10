import { AdminDashboardPage } from '@/components/admin/dashboard/AdminDashboardPage';
import {
  getAdminCustomers,
  getAdminProducts,
  getShopAnalyticsDashboard,
  getShopNotifications,
  getShopOrders,
} from '@/lib/api/endpoints';
import type { Session } from '@/lib/auth/session';
import { normalizeOrderStatusRows } from '@/lib/orders/normalizeOrderStatusRows';

function daysUntil(dateLike?: string | null) {
  if (!dateLike) return null;
  const expiry = new Date(dateLike);
  if (Number.isNaN(expiry.getTime())) return null;
  expiry.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

function productEmoji(name: string, category?: string | null) {
  const value = `${category ?? ''} ${name}`.toLowerCase();
  if (value.includes('milk') || value.includes('dairy') || value.includes('yoghurt')) return '\u{1F95B}';
  if (value.includes('bread') || value.includes('bak')) return '\u{1F35E}';
  if (value.includes('salad') || value.includes('veg')) return '\u{1F957}';
  if (value.includes('cheese')) return '\u{1F9C0}';
  if (value.includes('meat') || value.includes('chicken')) return '\u{1F356}';
  if (value.includes('fish') || value.includes('seafood')) return '\u{1F41F}';
  return '\u{1F4E6}';
}

export default async function AdminHomePage() {
  const [analyticsResult, productsResult, ordersResult, customersResult, notificationsResult] = await Promise.allSettled([
    getShopAnalyticsDashboard(),
    getAdminProducts(),
    getShopOrders(),
    getAdminCustomers(),
    getShopNotifications(),
  ]);

  const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;
  const products = productsResult.status === 'fulfilled' ? productsResult.value.data : [];
  const customers = customersResult.status === 'fulfilled' ? customersResult.value.data : [];
  const notifications = notificationsResult.status === 'fulfilled' ? notificationsResult.value : [];
  const normalizedOrders =
    ordersResult.status === 'fulfilled'
      ? normalizeOrderStatusRows(
          ordersResult.value.data as unknown[],
          { isAuthenticated: true, role: 'shop' } satisfies Session,
          'shop',
        )
      : [];

  const expiring = products
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      daysLeft: daysUntil(product.expiresOn),
    }))
    .filter((product) => product.daysLeft !== null && product.daysLeft >= 0 && product.daysLeft <= 7)
    .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      name: product.name,
      emoji: productEmoji(product.name, product.category),
      daysLeft: product.daysLeft ?? 0,
    }));

  const categories = Array.from(
    products.reduce((map, product) => {
      const name = product.category || product.categories?.[0] || 'Uncategorized';
      map.set(name, (map.get(name) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const alerts = [];
  if (expiring.length > 0) {
    alerts.push({
      id: 'expiring',
      type: 'warn' as const,
      message: `${expiring.length} product${expiring.length === 1 ? '' : 's'} need attention within 7 days.`,
      href: '/admin/products',
    });
  }
  const unreadNotifications = notifications.filter((item) => !item.is_read).length;
  if (unreadNotifications > 0) {
    alerts.push({
      id: 'notifications',
      type: 'info' as const,
      message: `${unreadNotifications} unread notification${unreadNotifications === 1 ? '' : 's'} from your shop activity.`,
      href: '/account/notifications',
    });
  }

  const stats = {
    totalProducts: products.length,
    totalUsers: customers.length,
    totalOrders: normalizedOrders.length,
    revenue: analytics?.totalRevenue ?? normalizedOrders.reduce((sum, order) => sum + order.total, 0),
    lowStockCount: analytics?.lowStockCount ?? 0,
  };

  const recentOrders = normalizedOrders
    .slice()
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 6)
    .map((order) => ({
      id: order.id,
      customer: order.userName,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      refCode: order.refCode,
    }));

  const liveDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <AdminDashboardPage
      stats={stats}
      alerts={alerts}
      expiring={expiring}
      recentOrders={recentOrders}
      categories={categories}
      liveDate={liveDate}
    />
  );
}
