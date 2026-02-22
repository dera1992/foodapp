import { Heart, Package, ShoppingCart, Wallet } from 'lucide-react';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { KPIStatCard } from '@/components/analytics/KPIStatCard';
import { ProgressMetricRow } from '@/components/analytics/ProgressMetricRow';
import { SectionEmptyState } from '@/components/analytics/SectionEmptyState';
import { StatusPill } from '@/components/analytics/StatusPill';
import { TableCard } from '@/components/analytics/TableCard';
import { Container } from '@/components/layout/Container';
import { getCustomerAnalyticsDashboard } from '@/lib/api/endpoints';
import { formatDate } from '@/lib/utils/format';
import { formatCurrency } from '@/lib/utils/money';

export default async function CustomerAnalyticsPage() {
  const analytics = await getCustomerAnalyticsDashboard().catch(() => null);

  return (
    <div className="bf-analytics-page-wrap py-10">
      <Container className="space-y-8">
        <AnalyticsHeader
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'My Analytics' }
          ]}
          title="Customer"
          titleAccent="Analytics"
          subtitle="Track your spend, favourite categories, and subscriptions at a glance."
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <KPIStatCard
            label="Total Spend"
            value={formatCurrency(analytics?.totalSpend ?? 0)}
            icon={<Wallet className="h-5 w-5" />}
            rows={[{ label: 'Lifetime spend', value: formatCurrency(analytics?.totalSpend ?? 0) }]}
            accentClassName="bf-analytics-accent-green"
            iconClassName="bg-emerald-100 text-emerald-700"
            delayClassName="bf-analytics-delay-1"
          />
          <KPIStatCard
            label="Orders"
            value={String(analytics?.totalOrders ?? 0)}
            icon={<Package className="h-5 w-5" />}
            rows={[
              { label: 'Total orders', value: String(analytics?.totalOrders ?? 0) },
              { label: 'Avg order value', value: formatCurrency(analytics?.avgOrderValue ?? 0) }
            ]}
            accentClassName="bf-analytics-accent-blue"
            iconClassName="bg-blue-100 text-blue-700"
            delayClassName="bf-analytics-delay-2"
          />
          <KPIStatCard
            label="Wishlist"
            value={String(analytics?.wishlistCount ?? 0)}
            icon={<Heart className="h-5 w-5" />}
            rows={[
              { label: 'Saved items', value: String(analytics?.wishlistCount ?? 0) },
              { label: 'Alerts waiting', value: String(analytics?.alertsCount ?? 0) }
            ]}
            accentClassName="bf-analytics-accent-red"
            iconClassName="bg-red-100 text-red-700"
            delayClassName="bf-analytics-delay-3"
          />
          <KPIStatCard
            label="Items Bought"
            value={String(analytics?.itemsBought ?? 0)}
            icon={<ShoppingCart className="h-5 w-5" />}
            rows={[{ label: 'Total items', value: String(analytics?.itemsBought ?? 0) }]}
            accentClassName="bf-analytics-accent-purple"
            iconClassName="bg-purple-100 text-purple-700"
            delayClassName="bf-analytics-delay-4"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <TableCard title="Top Categories" actionLabel="View all ->" actionHref="/shops">
            {analytics?.topCategories.length ? (
              <div className="space-y-1">
                {analytics.topCategories.map((row) => (
                  <ProgressMetricRow key={row.name} label={row.name} value={String(row.quantity)} percent={row.percent} />
                ))}
              </div>
            ) : (
              <SectionEmptyState
                emoji="🛍️"
                title="No purchases yet."
                description="Start shopping to see your top categories."
                actionLabel="Browse deals ->"
                actionHref="/shops"
              />
            )}
          </TableCard>

          <TableCard title="Favourite Shops" actionLabel="View all ->" actionHref="/shops">
            {analytics?.favouriteShops.length ? (
              <div className="space-y-1">
                {analytics.favouriteShops.map((row) => (
                  <div key={row.id || row.name} className="bf-analytics-list-row">
                    <div className="bf-analytics-avatar">{row.name.slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-text">{row.name}</p>
                      <p className="text-xs text-brand-muted">{row.location || 'Location unavailable'}</p>
                    </div>
                    <p className="font-serif text-base font-bold text-brand-primaryDark">{row.orders}</p>
                  </div>
                ))}
              </div>
            ) : (
              <SectionEmptyState emoji="🏪" title="No shop favourites yet." description="Subscribe to shops to track your favourites." />
            )}
          </TableCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <TableCard title="Subscribed Shops" actionLabel="Manage ->" actionHref="/shops">
            {analytics?.subscribedShops.length ? (
              <div className="space-y-1">
                {analytics.subscribedShops.map((row) => (
                  <div key={row.id} className="bf-analytics-list-row group">
                    <div className="bf-analytics-avatar">{row.name.slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-text">{row.name}</p>
                      <p className="text-xs text-brand-muted">{row.city || 'City unavailable'}</p>
                    </div>
                    <span className="rounded-full bg-brand-primaryLight px-3 py-1 text-xs font-semibold text-brand-primaryDark">Subscribed</span>
                    <button type="button" className="hidden rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 group-hover:inline-flex">
                      Unsubscribe
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <SectionEmptyState emoji="🔔" title="No subscriptions yet." description="Subscribe to stores to get notified of new deals." />
            )}
          </TableCard>

          <TableCard title="Recent Orders" actionLabel="View all ->" actionHref="/cart">
            {analytics?.recentOrders.length ? (
              <div className="space-y-1">
                {analytics.recentOrders.map((row) => (
                  <div key={row.id} className="bf-analytics-list-row">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primaryLight">📦</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-text">{row.ref || row.id}</p>
                      <p className="text-xs text-brand-muted">{row.date ? formatDate(row.date) : 'Date unavailable'}</p>
                    </div>
                    <p className="font-serif text-base font-bold text-brand-primaryDark">{formatCurrency(row.total)}</p>
                    <StatusPill status={row.status} />
                  </div>
                ))}
              </div>
            ) : (
              <SectionEmptyState
                emoji="📋"
                title="No completed orders yet."
                description="Browse deals to place your first order."
                actionLabel="Browse deals ->"
                actionHref="/shops"
              />
            )}
          </TableCard>
        </div>
      </Container>
    </div>
  );
}
