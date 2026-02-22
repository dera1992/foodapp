import { AlertCircle, BarChart3, Package, Users } from 'lucide-react';
import { KPIStatCard } from '@/components/analytics/KPIStatCard';
import { SectionEmptyState } from '@/components/analytics/SectionEmptyState';
import { TableCard } from '@/components/analytics/TableCard';
import { Card } from '@/components/ui/Card';
import { getShopAnalyticsDashboard } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/money';

export default async function AdminAnalyticsPage() {
  const data = await getShopAnalyticsDashboard().catch(() => null);

  if (!data) {
    return (
      <Card className="p-8">
        <SectionEmptyState emoji="🏪" title="No analytics data yet" description="Create products and orders to unlock analytics." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bf-admin-identity-card p-7">
        <div className="bf-admin-shop-avatar">{data.identity.shopName.slice(0, 2).toUpperCase()}</div>
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">{data.identity.shopName}</h2>
          <p className="mt-1 text-sm text-brand-muted">{data.identity.address || 'Address unavailable'}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <span className="bf-admin-pill bf-admin-pill-blue">👥 Followers {data.identity.followerCount}</span>
          <span className="bf-admin-pill bf-admin-pill-amber">⭐ Avg Rating {data.identity.avgRating.toFixed(1)}</span>
          <span className="bf-admin-pill bf-admin-pill-neutral">{data.identity.reviewCount} reviews</span>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KPIStatCard
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={<BarChart3 className="h-5 w-5" />}
          rows={[{ label: 'Across orders', value: String(data.totalOrders) }]}
          accentClassName="bf-analytics-accent-green"
          iconClassName="bg-emerald-100 text-emerald-700"
          delayClassName="bf-analytics-delay-1"
        />
        <KPIStatCard
          label="Items Sold"
          value={String(data.itemsSold)}
          icon={<Package className="h-5 w-5" />}
          rows={[{ label: 'Avg order value', value: formatCurrency(data.avgOrderValue) }]}
          accentClassName="bf-analytics-accent-blue"
          iconClassName="bg-blue-100 text-blue-700"
          delayClassName="bf-analytics-delay-2"
        />
        <KPIStatCard
          label="Customer Reach"
          value={String(data.uniqueBuyers)}
          icon={<Users className="h-5 w-5" />}
          rows={[{ label: 'Unique buyers', value: String(data.uniqueBuyers) }]}
          accentClassName="bf-analytics-accent-purple"
          iconClassName="bg-purple-100 text-purple-700"
          delayClassName="bf-analytics-delay-3"
        />
        <KPIStatCard
          label="Low Stock Alerts"
          value={String(data.lowStockCount)}
          icon={<AlertCircle className="h-5 w-5" />}
          rows={[{ label: 'Threshold <= 5', value: String(data.lowStockCount) }]}
          accentClassName={data.lowStockCount > 0 ? 'bf-analytics-accent-red' : 'bf-analytics-accent-amber'}
          iconClassName="bg-orange-100 text-orange-700"
          delayClassName="bf-analytics-delay-4"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableCard title="Top-Selling Items" subtitle="This month">
          {data.topSellingItems.length ? (
            <div className="space-y-1">
              {data.topSellingItems.map((item, index) => (
                <div key={item.name} className="bf-analytics-list-row">
                  <span className="bf-admin-rank-badge">#{index + 1}</span>
                  <p className="flex-1 text-sm font-semibold text-brand-text">{item.name}</p>
                  <p className="font-serif text-base font-bold text-brand-primaryDark">{item.units}</p>
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState emoji="📦" title="No sales yet." description="Top-selling items will appear here." />
          )}
        </TableCard>
        <TableCard title="Customer Demographics" subtitle="By location">
          {data.customerDemographics.length ? (
            <div className="space-y-3">
              {data.customerDemographics.map((row) => (
                <div key={row.city}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-brand-text">{row.city}</p>
                    <p className="font-serif text-base font-bold text-blue-700">{row.customers}</p>
                  </div>
                  <div className="bf-analytics-progress-track bg-blue-100">
                    <div className="bf-analytics-progress-fill bg-blue-500" style={{ width: `${row.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SectionEmptyState emoji="🗺️" title="No customer location data available." description="Demographics will populate as orders grow." />
          )}
        </TableCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-7">
          <h3 className="text-xl font-semibold text-brand-text">
            Inventory <span className="text-brand-primaryDark italic">Performance</span>
          </h3>
          <p className="mt-1 text-sm text-brand-muted">Automated low-stock alerts and popularity signals.</p>
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">🔴 Low stock</p>
          {data.inventory.lowStock.length ? (
            <div className="space-y-2">
              {data.inventory.lowStock.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2">
                  <span className="text-sm font-medium text-brand-text">{item.name}</span>
                  <span className="text-xs font-bold text-red-700">{item.stock ?? 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">✅ All products are healthy.</p>
          )}
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">🟢 Popular products</p>
          {data.inventory.popular.length ? (
            <div className="space-y-2">
              {data.inventory.popular.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-brand-primaryLight px-3 py-2">
                  <span className="text-sm font-medium text-brand-text">{item.name}</span>
                  <span className="text-xs font-bold text-brand-primaryDark">{item.sold} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-brand-muted">No popularity data yet.</p>
          )}
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">🟡 Slow movers</p>
          {data.inventory.slowMovers.length ? (
            <div className="space-y-2">
              {data.inventory.slowMovers.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
                  <span className="text-sm font-medium text-brand-text">{item.name}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Needs attention</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-brand-muted">No slow movers detected.</p>
          )}
        </Card>

        <Card className="p-7">
          <h3 className="text-xl font-semibold text-brand-text">
            Subscription <span className="text-brand-primaryDark italic">Insights</span>
          </h3>
          <p className="mt-1 text-sm text-brand-muted">Review plan status, upgrade options, and performance.</p>
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Current plan</p>
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-lg font-semibold text-brand-text">{data.subscription.currentPlan || 'No Plan'}</h4>
            <span className={data.subscription.active ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700'}>
              {data.subscription.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {typeof data.subscription.daysLeft === 'number' ? <p className="mt-1 text-xs text-brand-muted">{data.subscription.daysLeft} days left</p> : null}
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Performance snapshot</p>
          <div className="space-y-1">
            <div className="bf-analytics-stat-row"><span>Customer reach</span><strong>{data.uniqueBuyers} buyers</strong></div>
            <div className="bf-analytics-stat-row"><span>Follower growth</span><strong>{data.identity.followerCount} followers</strong></div>
            <div className="bf-analytics-stat-row"><span>Customer feedback</span><strong>{data.identity.avgRating.toFixed(1)} avg rating</strong></div>
          </div>
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">🚀 Upgrade options</p>
          {data.subscription.upgrades.length ? (
            <div className="space-y-2">
              {data.subscription.upgrades.map((plan) => (
                <div key={plan.name} className="rounded-xl border border-brand-border bg-brand-background px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-brand-text">{plan.name}</p>
                    <p className="font-serif font-bold text-brand-primaryDark">{formatCurrency(plan.price)}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-xs text-brand-muted">{plan.productLimit ?? 0} products</p>
                    <button type="button" className="rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white hover:bg-brand-primaryDark">
                      Upgrade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-muted">
              No subscription plans available. <span className="font-semibold text-brand-primaryDark">Contact us -&gt;</span>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
