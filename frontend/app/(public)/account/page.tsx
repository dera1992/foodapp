import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  Bell,
  Heart,
  Package,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getCustomerAnalyticsDashboard, getUserOrders } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/money';
import { formatDate } from '@/lib/utils/format';

const QUICK_LINKS = [
  { href: '/account/orders', label: 'My Orders', description: 'View and track all your orders', icon: Package, color: 'bg-blue-50 text-blue-600' },
  { href: '/wishlist', label: 'Wishlist', description: 'Items you saved for later', icon: Heart, color: 'bg-red-50 text-red-600' },
  { href: '/account/analytics', label: 'Analytics', description: 'Your spending & habits', icon: BarChart2, color: 'bg-purple-50 text-purple-600' },
  { href: '/account/notifications', label: 'Notifications', description: 'Alerts and updates', icon: Bell, color: 'bg-amber-50 text-amber-600' },
  { href: '/account/settings', label: 'Settings', description: 'Profile and preferences', icon: Settings, color: 'bg-slate-50 text-slate-600' },
  { href: '/shops', label: 'Browse Deals', description: 'Discover new food deals', icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
];

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes('deliver')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('paid') || s.includes('confirmed')) return 'bg-amber-100 text-amber-700';
  if (s.includes('preparing')) return 'bg-purple-100 text-purple-700';
  return 'bg-blue-100 text-blue-700';
}

export default async function AccountOverviewPage() {
  const session = await getSession();

  const [analytics, ordersPayload] = await Promise.all([
    getCustomerAnalyticsDashboard().catch(() => null),
    getUserOrders().catch(() => ({ data: [] })),
  ]);

  const recentOrders = (Array.isArray(ordersPayload.data) ? ordersPayload.data : [])
    .slice(0, 5)
    .map((o: unknown) => {
      const r = o && typeof o === 'object' ? (o as Record<string, unknown>) : {};
      return {
        ref: String(r.ref ?? r.id ?? ''),
        status: String(r.status ?? 'Order placed'),
        total: typeof r.total === 'number' ? r.total : 0,
        created: String(r.created ?? r.created_at ?? ''),
        itemsSummary: String(r.items_summary ?? ''),
      };
    });

  const firstName = session.email?.split('@')[0] ?? 'there';

  return (
    <div className="max-w-4xl space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hi, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here's a summary of your account activity.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total orders</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.totalOrders ?? recentOrders.length}</p>
          <Link href="/account/orders" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total spent</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(analytics?.totalSpend ?? 0)}</p>
          <Link href="/account/analytics" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline">
            See analytics <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Wishlist items</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.wishlistCount ?? 0}</p>
          <Link href="/wishlist" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline">
            View wishlist <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-primary" />
            Recent Orders
          </h2>
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentOrders.length ? recentOrders.map((order) => (
            <Link
              key={order.ref}
              href={`/account/orders/${order.ref}`}
              className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-700 font-mono">{order.ref.slice(0, 12)}…</p>
                {order.itemsSummary && (
                  <p className="truncate text-xs text-slate-400 mt-0.5">{order.itemsSummary}</p>
                )}
                {order.created && (
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.created)}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {order.total > 0 && (
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(order.total)}</p>
                )}
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>
                  {order.status}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
          )) : (
            <div className="px-6 py-10 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No orders yet.</p>
              <Link href="/shops" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
                Browse deals <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ href, label, description, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand-primary/30 hover:shadow-sm transition-all"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-primary transition-colors">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-200 group-hover:text-brand-primary transition-colors self-center" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
