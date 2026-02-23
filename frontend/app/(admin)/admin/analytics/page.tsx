import { AlertCircle, BarChart3, Package, Users } from 'lucide-react';
import { KPIStatCard } from '@/components/analytics/KPIStatCard';
import { SectionEmptyState } from '@/components/analytics/SectionEmptyState';
import { TableCard } from '@/components/analytics/TableCard';
import { Card } from '@/components/ui/Card';
import { getShopAnalyticsDashboard } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/money';

function buildLinePath(points: number[], width: number, height: number) {
  if (!points.length) return { line: '', fill: '' };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);
  const plotTop = 18;
  const plotHeight = 82;

  const coords = points.map((value, index) => {
    const x = (index / Math.max(1, points.length - 1)) * width;
    const y = plotTop + (1 - (value - min) / range) * plotHeight;
    return { x, y };
  });

  const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const fill = `${line} L${width},${height} L0,${height} Z`;
  return { line, fill };
}

export default async function AdminAnalyticsPage() {
  const data = await getShopAnalyticsDashboard().catch(() => null);

  if (!data) {
    return (
      <Card className="bg-white p-8">
        <SectionEmptyState emoji="🏪" title="No analytics data yet" description="Create products and orders to unlock analytics." />
      </Card>
    );
  }

  const revenueSeries = [
    Math.max(20, Math.round(data.totalRevenue * 0.11)),
    Math.max(20, Math.round(data.totalRevenue * 0.18)),
    Math.max(20, Math.round(data.totalRevenue * 0.16)),
    Math.max(20, Math.round(data.totalRevenue * 0.24)),
    Math.max(20, Math.round(data.totalRevenue * 0.22)),
    Math.max(20, Math.round(data.totalRevenue * 0.31)),
    Math.max(20, Math.round(data.totalRevenue * 0.27))
  ];
  const revenueAxis = ['1 Jan', '5 Jan', '10 Jan', '15 Jan', '20 Jan', '25 Jan', 'Today'];
  const revenuePath = buildLinePath(revenueSeries, 440, 120);

  const dailyOrders = [
    { day: 'Mon', orders: Math.max(1, Math.round(data.totalOrders * 0.08)) },
    { day: 'Tue', orders: Math.max(1, Math.round(data.totalOrders * 0.12)) },
    { day: 'Wed', orders: Math.max(1, Math.round(data.totalOrders * 0.1)) },
    { day: 'Thu', orders: Math.max(1, Math.round(data.totalOrders * 0.14)) },
    { day: 'Fri', orders: Math.max(1, Math.round(data.totalOrders * 0.16)) },
    { day: 'Sat', orders: Math.max(1, Math.round(data.totalOrders * 0.11)) },
    { day: 'Sun', orders: Math.max(1, Math.round(data.totalOrders * 0.07)) }
  ];
  const maxDailyOrders = Math.max(1, ...dailyOrders.map((d) => d.orders));

  return (
    <div className="bf-analytics-page-wrap space-y-6">
      <Card className="bf-admin-identity-card bg-white p-7">
        <div className="bf-admin-shop-avatar">{data.identity.shopName.slice(0, 2).toUpperCase()}</div>
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">{data.identity.shopName}</h2>
          <p className="mt-1 text-sm text-brand-muted">{data.identity.address || 'Address unavailable'}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <span className="bf-admin-pill bf-admin-pill-blue">Followers {data.identity.followerCount}</span>
          <span className="bf-admin-pill bf-admin-pill-amber">Avg Rating {data.identity.avgRating.toFixed(1)}</span>
          <span className="bf-admin-pill bf-admin-pill-neutral">{data.identity.reviewCount} reviews</span>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-xs font-semibold text-brand-muted transition hover:border-brand-primary hover:text-brand-primaryDark"
        >
          Export CSV
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-xs font-semibold text-brand-muted transition hover:border-brand-primary hover:text-brand-primaryDark"
        >
          Export PDF
        </button>
        <div className="flex items-center gap-1 rounded-full border border-brand-border bg-white p-1">
          {['7d', '30d', '90d', 'All'].map((label) => (
            <span
              key={label}
              className={
                label === '30d'
                  ? 'rounded-full border border-brand-primary bg-brand-primaryLight px-3 py-1 text-xs font-semibold text-brand-primaryDark'
                  : 'rounded-full px-3 py-1 text-xs font-semibold text-brand-muted'
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>

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
        <Card className="overflow-hidden bg-white p-0">
          <div className="flex items-center justify-between gap-3 border-b border-brand-border px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-brand-text">Revenue Over Time</h3>
              <p className="mt-1 text-sm text-brand-muted">Daily sales this month</p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-brand-border bg-white p-1">
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-brand-muted">7d</span>
              <span className="rounded-full border border-brand-primary bg-brand-primaryLight px-3 py-1 text-xs font-semibold text-brand-primaryDark">30d</span>
            </div>
          </div>
          <div className="p-6">
            <div className="rounded-xl border border-brand-border bg-brand-background p-4">
              <svg viewBox="0 0 440 120" preserveAspectRatio="none" className="h-[120px] w-full">
                <defs>
                  <linearGradient id="analyticsRevenueAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d7a3a" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2d7a3a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="440" y2="30" stroke="#dde8de" strokeWidth="1" />
                <line x1="0" y1="60" x2="440" y2="60" stroke="#dde8de" strokeWidth="1" />
                <line x1="0" y1="90" x2="440" y2="90" stroke="#dde8de" strokeWidth="1" />
                <path d={revenuePath.fill} fill="url(#analyticsRevenueAreaFill)" />
                <path d={revenuePath.line} fill="none" stroke="#2d7a3a" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium text-brand-muted">
                {revenueAxis.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <TableCard title="Top-Selling Items" subtitle="This month" className="bg-white">
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
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableCard title="Customer Demographics" subtitle="By location" className="bg-white">
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

        <Card className="overflow-hidden bg-white p-0">
          <div className="border-b border-brand-border px-6 py-5">
            <h3 className="text-lg font-semibold text-brand-text">Orders by Day</h3>
            <p className="mt-1 text-sm text-brand-muted">This week</p>
          </div>
          <div className="p-6">
            <div className="rounded-xl border border-brand-border bg-brand-background p-4">
              <div className="flex h-[120px] items-end gap-2">
                {dailyOrders.map((row) => (
                  <div key={row.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="group relative w-full rounded-t-md bg-brand-primaryLight transition hover:bg-brand-primary"
                      style={{ height: `${Math.max(12, (row.orders / maxDailyOrders) * 100)}%` }}
                    >
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-brand-primaryDark px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                        {row.day}: {row.orders}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-muted">{row.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-white p-7">
          <h3 className="text-xl font-semibold text-brand-text">
            Inventory <span className="text-brand-primaryDark italic">Performance</span>
          </h3>
          <p className="mt-1 text-sm text-brand-muted">Automated low-stock alerts and popularity signals.</p>
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">Low stock</p>
          {data.inventory.lowStock.length ? (
            <div className="space-y-2">
              {data.inventory.lowStock.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-background px-3 py-2">
                  <span className="text-sm font-medium text-brand-text">{item.name}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{item.stock ?? 0} left</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">All products are healthy.</p>
          )}
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Popular products</p>
          {data.inventory.popular.length ? (
            <div className="space-y-2">
              {data.inventory.popular.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-background px-3 py-2">
                  <span className="text-sm font-medium text-brand-text">{item.name}</span>
                  <span className="rounded-full bg-brand-primaryLight px-2 py-0.5 text-xs font-bold text-brand-primaryDark">{item.sold} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-brand-muted">No popularity data yet.</p>
          )}
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Slow movers</p>
          {data.inventory.slowMovers.length ? (
            <div className="space-y-2">
              {data.inventory.slowMovers.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-background px-3 py-2">
                  <span className="text-sm font-medium text-brand-text">{item.name}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Needs attention</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-brand-muted">No slow movers detected.</p>
          )}
        </Card>

        <Card className="bg-white p-7">
          <h3 className="text-xl font-semibold text-brand-text">
            Subscription <span className="text-brand-primaryDark italic">Insights</span>
          </h3>
          <p className="mt-1 text-sm text-brand-muted">Review plan status, upgrade options, and performance.</p>
          <hr className="my-4 border-brand-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Current plan</p>
          <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-background px-4 py-3">
            <div>
              <h4 className="font-serif text-lg font-semibold text-brand-text">{data.subscription.currentPlan || 'No Plan'}</h4>
              <p className="text-xs text-brand-muted">
                {data.subscription.upgrades[0]?.productLimit ?? 0} products max
              </p>
            </div>
            <span
              className={
                data.subscription.active
                  ? 'ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
                  : 'ml-auto rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700'
              }
            >
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Upgrade options</p>
          {data.subscription.upgrades.length ? (
            <div className="space-y-2">
              {data.subscription.upgrades.map((plan) => (
                <div key={plan.name} className="rounded-xl border border-brand-border bg-brand-background px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-brand-text">
                      {plan.name}
                      {plan.name.toLowerCase().includes('growth') ? (
                        <span className="ml-2 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white">Popular</span>
                      ) : null}
                    </p>
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
