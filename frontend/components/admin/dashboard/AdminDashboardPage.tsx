'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './AdminDashboardPage.module.css';

type DashboardStats = {
  totalProducts: number;
  productChange: number;
  totalUsers: number;
  userChange: number;
  totalOrders: number;
  orderChange: number;
  revenue: number;
  revenueChange: number;
};

type RevenueDataPoint = {
  date: string;
  revenue: number;
  orders: number;
};

type ActivityItem = {
  id: string;
  type: 'order' | 'product' | 'user' | 'alert' | 'delivery';
  title: string;
  subtitle: string;
  timestamp: string;
};

type ExpiringProduct = {
  id: string;
  name: string;
  emoji: string;
  expiryDate: string;
  daysLeft: number;
};

type RecentOrder = {
  id: string;
  customer: string;
  itemCount: number;
  total: number;
  status: 'delivered' | 'pending' | 'processing' | 'cancelled';
  createdAt: string;
};

type CategoryCount = {
  name: string;
  count: number;
};

type OrderStatusBreakdown = {
  delivered: number;
  pending: number;
  processing: number;
  cancelled: number;
};

type ChartPeriod = '7d' | '30d' | '90d';

type AlertItem = {
  id: string;
  type: 'warn' | 'info';
  message: string;
};

const MOCK_STATS: DashboardStats = {
  totalProducts: 48,
  productChange: 12,
  totalUsers: 234,
  userChange: 5,
  totalOrders: 91,
  orderChange: 22,
  revenue: 1847,
  revenueChange: 18
};

const MOCK_REVENUE: Record<ChartPeriod, RevenueDataPoint[]> = {
  '7d': ([
    ['Mon', 120, 7],
    ['Tue', 160, 9],
    ['Wed', 210, 12],
    ['Thu', 180, 10],
    ['Fri', 260, 14],
    ['Sat', 290, 17],
    ['Sun', 240, 13]
  ] as Array<[string, number, number]>).map(([date, revenue, orders]) => ({ date, revenue, orders })),
  '30d': ([
    ['1 Jan', 180, 8],
    ['5 Jan', 240, 11],
    ['10 Jan', 320, 15],
    ['15 Jan', 280, 12],
    ['20 Jan', 360, 17],
    ['25 Jan', 410, 19],
    ['Today', 390, 18]
  ] as Array<[string, number, number]>).map(([date, revenue, orders]) => ({ date, revenue, orders })),
  '90d': ([
    ['Nov', 980, 45],
    ['Dec', 1210, 56],
    ['Jan', 1460, 64],
    ['Feb', 1847, 91]
  ] as Array<[string, number, number]>).map(([date, revenue, orders]) => ({ date, revenue, orders }))
};

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'order', title: 'New order #1042', subtitle: 'Sarah T. - £14.50', timestamp: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: '2', type: 'product', title: 'Product listed', subtitle: 'Wholemeal Bread x12', timestamp: new Date(Date.now() - 18 * 60_000).toISOString() },
  { id: '3', type: 'user', title: 'New customer', subtitle: 'James K. registered', timestamp: new Date(Date.now() - 60 * 60_000).toISOString() },
  { id: '4', type: 'alert', title: 'Low stock alert', subtitle: 'Organic Yoghurt - 2 left', timestamp: new Date(Date.now() - 2 * 60 * 60_000).toISOString() },
  { id: '5', type: 'delivery', title: 'Order delivered', subtitle: '#1038 - Maria L.', timestamp: new Date(Date.now() - 3 * 60 * 60_000).toISOString() }
];

const MOCK_EXPIRING: ExpiringProduct[] = [
  { id: '1', name: 'Organic Whole Milk', emoji: '🥛', expiryDate: '', daysLeft: 1 },
  { id: '2', name: 'Sourdough Loaf', emoji: '🍞', expiryDate: '', daysLeft: 2 },
  { id: '3', name: 'Mixed Salad Bag', emoji: '🥗', expiryDate: '', daysLeft: 4 },
  { id: '4', name: 'Cheddar Cheese', emoji: '🧀', expiryDate: '', daysLeft: 5 },
  { id: '5', name: 'Greek Yoghurt', emoji: '🥣', expiryDate: '', daysLeft: 7 }
];

const MOCK_ORDERS: RecentOrder[] = [
  { id: '1042', customer: 'Sarah T.', itemCount: 3, total: 14.5, status: 'pending', createdAt: new Date().toISOString() },
  { id: '1041', customer: 'James K.', itemCount: 1, total: 3.2, status: 'processing', createdAt: new Date().toISOString() },
  { id: '1040', customer: 'Maria L.', itemCount: 5, total: 22.75, status: 'delivered', createdAt: new Date().toISOString() },
  { id: '1039', customer: 'David R.', itemCount: 2, total: 8, status: 'delivered', createdAt: new Date().toISOString() },
  { id: '1038', customer: 'Lucy M.', itemCount: 4, total: 17.3, status: 'cancelled', createdAt: new Date().toISOString() }
];

const MOCK_CATEGORIES: CategoryCount[] = [
  { name: 'Bakery', count: 18 },
  { name: 'Dairy', count: 13 },
  { name: 'Produce', count: 22 },
  { name: 'Meat', count: 8 },
  { name: 'Deli', count: 5 }
];

const MOCK_ORDER_STATUS: OrderStatusBreakdown = {
  delivered: 47,
  pending: 20,
  processing: 16,
  cancelled: 8
};

function relativeTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusClass(status: RecentOrder['status']) {
  return styles[`status_${status}`];
}

function expiryClass(daysLeft: number) {
  if (daysLeft <= 2) return styles.expiryUrgent;
  if (daysLeft <= 5) return styles.expirySoon;
  return styles.expiryOk;
}

function formatCurrency(value: number) {
  return `£${value.toLocaleString()}`;
}

function buildAreaPath(data: RevenueDataPoint[], key: 'revenue' | 'orders', width: number, height: number, topPadding = 12, bottomPadding = 12) {
  if (!data.length) return { linePath: '', fillPath: '' };
  const values = data.map((d) => d[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const innerH = height - topPadding - bottomPadding;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((point, index) => {
    const x = index * stepX;
    const y = topPadding + (1 - (point[key] - min) / range) * innerH;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const fillPath = `${linePath} L ${points[points.length - 1]!.x.toFixed(2)} ${height} L ${points[0]!.x.toFixed(2)} ${height} Z`;
  return { linePath, fillPath };
}

function CountUp({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let raf = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      frame += 1;
      if (frame) cancelAnimationFrame(raf);
    };
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString()}</span>;
}

function StatCard(props: {
  icon: string;
  iconTone: 'green' | 'blue' | 'amber' | 'purple';
  value: number;
  label: string;
  change: number;
  sub: string;
  prefix?: string;
}) {
  const { icon, iconTone, value, label, change, sub, prefix } = props;
  const isUp = change > 0;
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <div className={`${styles.statIcon} ${styles[`icon_${iconTone}`]}`}>{icon}</div>
        <span className={`${styles.statChange} ${isUp ? styles.changeUp : styles.changeDown}`}>
          {isUp ? '↑' : '↓'} {Math.abs(change)}%
        </span>
      </div>
      <div>
        <div className={styles.statValue}><CountUp value={value} prefix={prefix} /></div>
        <div className={styles.statLabel}>{label}</div>
      </div>
      <div className={styles.statSub}>{sub}</div>
    </div>
  );
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<ChartPeriod>('30d');
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatusBreakdown | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const fallbackAlerts = (): AlertItem[] => [
      {
        id: 'warn-expiry',
        type: 'warn',
        message: '3 products expiring within 48 hours - review and discount them to reduce waste.'
      },
      {
        id: 'info-csv',
        type: 'info',
        message: 'New feature: Bulk upload now supports CSV.'
      }
    ];

    const safeJson = async <T,>(url: string, fallback: T): Promise<T> => {
      try {
        const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return fallback;
        return (await res.json()) as T;
      } catch {
        return fallback;
      }
    };

    const load = async () => {
      setLoading(true);
      const [statsRes, revenueRes, activityRes, expiringRes, ordersRes, categoriesRes, orderStatusRes] = await Promise.all([
        safeJson<DashboardStats>('/api/dashboard/stats/', MOCK_STATS),
        safeJson<{ data: RevenueDataPoint[] }>(`/api/dashboard/revenue/?period=${period}`, { data: MOCK_REVENUE[period] }),
        safeJson<{ items: ActivityItem[] }>('/api/dashboard/activity/?limit=5', { items: MOCK_ACTIVITY }),
        safeJson<{ products: ExpiringProduct[] }>('/api/dashboard/expiring/?days=7', { products: MOCK_EXPIRING }),
        safeJson<{ orders: RecentOrder[] }>('/api/orders/?limit=5&sort=recent', { orders: MOCK_ORDERS }),
        safeJson<{ categories: CategoryCount[] }>('/api/dashboard/category-counts/', { categories: MOCK_CATEGORIES }),
        safeJson<OrderStatusBreakdown>('/api/dashboard/order-status/', MOCK_ORDER_STATUS)
      ]);

      if (!active) return;

      setStats(statsRes);
      setRevenueData(Array.isArray(revenueRes.data) && revenueRes.data.length ? revenueRes.data : MOCK_REVENUE[period]);
      setActivity(activityRes.items?.length ? activityRes.items : MOCK_ACTIVITY);
      setExpiring(expiringRes.products?.length ? expiringRes.products : MOCK_EXPIRING);
      setRecentOrders(ordersRes.orders?.length ? ordersRes.orders : MOCK_ORDERS);
      setCategories(categoriesRes.categories?.length ? categoriesRes.categories : MOCK_CATEGORIES);
      setOrderStatus(orderStatusRes);

      const urgentCount = (expiringRes.products?.length ? expiringRes.products : MOCK_EXPIRING).filter((p) => p.daysLeft <= 2).length;
      const nextAlerts = fallbackAlerts();
      if (urgentCount > 0) {
        nextAlerts[0] = {
          id: 'warn-expiry',
          type: 'warn',
          message: `${urgentCount} product${urgentCount === 1 ? '' : 's'} expiring within 48 hours - review and discount them.`
        };
      }
      setAlerts(nextAlerts);
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [period]);

  const liveDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
    []
  );

  const revenuePaths = useMemo(() => {
    const width = 540;
    const height = 160;
    return {
      revenue: buildAreaPath(revenueData, 'revenue', width, height, 20, 20),
      orders: buildAreaPath(revenueData, 'orders', width, height, 34, 22)
    };
  }, [revenueData]);

  const statusTotal = orderStatus
    ? orderStatus.delivered + orderStatus.pending + orderStatus.processing + orderStatus.cancelled
    : 0;

  const donutSegments = orderStatus
    ? [
        { key: 'delivered', label: 'Delivered', value: orderStatus.delivered, color: '#2d7a3a' },
        { key: 'pending', label: 'Pending', value: orderStatus.pending, color: '#f5a623' },
        { key: 'processing', label: 'Processing', value: orderStatus.processing, color: '#3b82f6' },
        { key: 'cancelled', label: 'Cancelled', value: orderStatus.cancelled, color: '#e84040' }
      ]
    : [];

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Admin</span>
            <span>›</span>
            <span className={styles.breadcrumbCurrent}>Overview</span>
          </div>
          <h1 className={styles.title}>Admin Overview</h1>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.dateText}>{liveDate}</span>
          <button type="button" className={styles.notifBtn} aria-label="Notifications">
            🔔
            <span className={styles.notifDot} />
          </button>
          <span className={styles.avatar}>AD</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.alerts}>
          {alerts.map((alert) => (
            <div key={alert.id} className={`${styles.alert} ${alert.type === 'warn' ? styles.alertWarn : styles.alertInfo}`}>
              <span aria-hidden="true">{alert.type === 'warn' ? '⚠️' : '📦'}</span>
              <span>{alert.message}</span>
              <button
                type="button"
                className={styles.alertClose}
                onClick={() => setAlerts((current) => current.filter((item) => item.id !== alert.id))}
                aria-label="Dismiss alert"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className={styles.statsGrid}>
          {loading || !stats ? (
            Array.from({ length: 4 }).map((_, index) => <div key={index} className={styles.skeletonCard} />)
          ) : (
            <>
              <StatCard icon="📦" iconTone="green" value={stats.totalProducts} label="Total Products" change={stats.productChange} sub="8 added this week" />
              <StatCard icon="👥" iconTone="blue" value={stats.totalUsers} label="Total Users" change={stats.userChange} sub="18 new this month" />
              <StatCard icon="🛒" iconTone="amber" value={stats.totalOrders} label="Orders" change={stats.orderChange} sub="3 pending fulfilment" />
              <StatCard icon="💰" iconTone="purple" value={stats.revenue} label="Revenue" change={stats.revenueChange} sub="This month" prefix="£" />
            </>
          )}
        </div>

        <div className={styles.row2}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Revenue &amp; Orders</h2>
              <div className={styles.periodTabs}>
                {(['7d', '30d', '90d'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
                    onClick={() => setPeriod(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.legend}>
              <span className={styles.legendItem}><i className={styles.legendDot} style={{ background: '#2d7a3a' }} />Revenue</span>
              <span className={styles.legendItem}><i className={styles.legendDot} style={{ background: '#f5a623' }} />Orders</span>
            </div>

            <div className={styles.chartWrap}>
              <svg viewBox="0 0 540 160" className={styles.chartSvg} preserveAspectRatio="none" aria-label="Revenue and orders chart">
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d7a3a" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2d7a3a" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="dashOrdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5a623" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 80, 120].map((y) => (
                  <line key={y} x1="0" y1={y} x2="540" y2={y} stroke="#dde8de" strokeWidth="1" />
                ))}
                {revenuePaths.revenue.fillPath ? <path d={revenuePaths.revenue.fillPath} fill="url(#dashRevGrad)" /> : null}
                {revenuePaths.orders.fillPath ? <path d={revenuePaths.orders.fillPath} fill="url(#dashOrdGrad)" /> : null}
                {revenuePaths.revenue.linePath ? <path d={revenuePaths.revenue.linePath} fill="none" stroke="#2d7a3a" strokeWidth="2.5" strokeLinecap="round" /> : null}
                {revenuePaths.orders.linePath ? <path d={revenuePaths.orders.linePath} fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" /> : null}
              </svg>
              <div className={styles.chartAxisLabels}>
                {revenueData.map((point, index) => (
                  <span key={`${point.date}-${index}`}>{point.date}</span>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent Activity</h2>
              <Link href="/admin/orders" className={styles.viewLink}>View all</Link>
            </div>
            <div className={styles.activityList}>
              {(activity.length ? activity : MOCK_ACTIVITY).map((item) => (
                <div className={styles.activityItem} key={item.id}>
                  <div className={`${styles.activityIcon} ${styles[`activity_${item.type}`]}`}>
                    {{ order: '🛒', product: '📦', user: '👤', alert: '⚠️', delivery: '✅' }[item.type]}
                  </div>
                  <div className={styles.activityText}>
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                  <span className={styles.activityTime}>{relativeTime(item.timestamp)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.row3}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Product Categories</h2>
            </div>
            <div className={styles.barChart}>
              {(categories.length ? categories : MOCK_CATEGORIES).map((cat, index, list) => {
                const max = Math.max(...list.map((item) => item.count), 1);
                const height = Math.max(12, (cat.count / max) * 100);
                return (
                  <div key={cat.name} className={styles.barCol}>
                    <div
                      className={styles.bar}
                      style={{
                        height: `${height}%`,
                        background: hoveredBar === index ? '#2d7a3a' : '#e8f5eb'
                      }}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <span className={styles.barTooltip}>{cat.name}: {cat.count}</span>
                    </div>
                    <div className={styles.barLabel}>{cat.name}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Order Status</h2>
            </div>
            <div className={styles.donutWrap}>
              <div className={styles.donutBox}>
                <svg viewBox="0 0 120 120" className={styles.donutSvg} aria-label="Order status breakdown">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#dde8de" strokeWidth="16" />
                  {donutSegments.map((segment) => {
                    const segmentLen = statusTotal ? (segment.value / statusTotal) * circumference : 0;
                    const dashArray = `${segmentLen.toFixed(2)} ${(circumference - segmentLen).toFixed(2)}`;
                    const dashOffset = -cumulative;
                    cumulative += segmentLen;
                    return (
                      <circle
                        key={segment.key}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="16"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 60 60)"
                      />
                    );
                  })}
                </svg>
                <div className={styles.donutCenter}>
                  <strong>{stats?.totalOrders ?? statusTotal}</strong>
                  <span>orders</span>
                </div>
              </div>
              <div className={styles.donutLegend}>
                {donutSegments.map((segment) => {
                  const pct = statusTotal ? Math.round((segment.value / statusTotal) * 100) : 0;
                  return (
                    <div key={segment.key} className={styles.donutLegendItem}>
                      <i className={styles.donutLegendDot} style={{ background: segment.color }} />
                      <span className={styles.donutLegendName}>{segment.label}</span>
                      <span className={styles.donutLegendPct}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>⏰ Expiring Soon</h2>
              <Link href="/admin/products" className={styles.viewLink}>Manage</Link>
            </div>
            <div className={styles.expiryList}>
              {(expiring.length ? expiring : MOCK_EXPIRING).map((product) => (
                <div key={product.id} className={styles.expiryRow}>
                  <span className={styles.expiryEmoji}>{product.emoji}</span>
                  <span className={styles.expiryName}>{product.name}</span>
                  <span className={`${styles.expiryBadge} ${expiryClass(product.daysLeft)}`}>
                    {product.daysLeft} day{product.daysLeft === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.row4}>
          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2 className={styles.cardTitle}>Recent Orders</h2>
              <Link href="/admin/orders" className={styles.viewLink}>View all →</Link>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders.length ? recentOrders : MOCK_ORDERS).map((order) => (
                    <tr key={order.id}>
                      <td className={styles.orderId}>#{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</td>
                      <td className={styles.orderTotal}>{formatCurrency(order.total)}</td>
                      <td>
                        <span className={`${styles.statusPill} ${statusClass(order.status)}`}>
                          {order.status[0]?.toUpperCase()}{order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Quick Actions</h2>
            </div>
            <div className={styles.quickActions}>
              {[
                { icon: '➕', label: 'Add New Product', href: '/admin/products/new' },
                { icon: '📤', label: 'Bulk Upload', href: '/admin/products/bulk-upload' },
                { icon: '🛒', label: 'Manage Orders', href: '/admin/orders' },
                { icon: '📈', label: 'View Analytics', href: '/admin/analytics' },
                { icon: '⏰', label: 'Expiring Products', href: '/admin/products?filter=expiring' },
                { icon: '👥', label: 'View Customers', href: '/admin/customers' }
              ].map((action) => (
                <Link key={action.label} href={action.href} className={styles.quickAction}>
                  <span className={styles.quickIcon}>{action.icon}</span>
                  <span className={styles.quickLabel}>{action.label}</span>
                  <span className={styles.quickArrow}>›</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
