'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './AdminDashboardPage.module.css';

export type DashboardStats = {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  revenue: number;
  lowStockCount: number;
};

export type RecentOrder = {
  id: string;
  customer: string;
  total: number;
  status: string;
  createdAt?: string | null;
  refCode: string;
};

export type ExpiringProduct = {
  id: string;
  name: string;
  emoji: string;
  daysLeft: number;
};

export type CategoryCount = {
  name: string;
  count: number;
};

export type AlertItem = {
  id: string;
  type: 'warn' | 'info';
  message: string;
  href?: string;
};

type Props = {
  stats: DashboardStats;
  alerts: AlertItem[];
  expiring: ExpiringProduct[];
  recentOrders: RecentOrder[];
  categories: CategoryCount[];
  liveDate: string;
};

function relativeTime(iso?: string | null): string {
  if (!iso) return 'Recently';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function prettyStatus(status: string): string {
  const value = status.replace(/_/g, ' ').trim();
  return value ? value.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Pending';
}

function orderStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('deliver')) return styles.status_delivered;
  if (normalized.includes('cancel')) return styles.status_cancelled;
  if (normalized.includes('process') || normalized.includes('prepare')) return styles.status_processing;
  return styles.status_pending;
}

function expiryClass(daysLeft: number) {
  if (daysLeft <= 2) return styles.expiryUrgent;
  if (daysLeft <= 5) return styles.expirySoon;
  return styles.expiryOk;
}

function formatCurrency(value: number) {
  return `£${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CountUp({ value, prefix = '' }: { value: number; prefix?: string }) {
  return (
    <span>
      {prefix}
      {value.toLocaleString()}
    </span>
  );
}

function StatCard(props: {
  icon: string;
  iconTone: 'green' | 'blue' | 'amber' | 'purple';
  value: number;
  label: string;
  sub: string;
  prefix?: string;
}) {
  const { icon, iconTone, value, label, sub, prefix } = props;
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <div className={`${styles.statIcon} ${styles[`icon_${iconTone}`]}`}>{icon}</div>
      </div>
      <div>
        <div className={styles.statValue}>
          <CountUp value={value} prefix={prefix} />
        </div>
        <div className={styles.statLabel}>{label}</div>
      </div>
      <div className={styles.statSub}>{sub}</div>
    </div>
  );
}

export function AdminDashboardPage({
  stats,
  alerts: initialAlerts,
  expiring,
  recentOrders,
  categories,
  liveDate,
}: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);

  return (
    <div className={styles.wrap}>
      <div className={styles.content}>
        <div className={styles.pageIntro}>
          <div className={styles.breadcrumb}>
            <span>Admin</span>
            <span>&rsaquo;</span>
            <span className={styles.breadcrumbCurrent}>Overview</span>
          </div>
          <div className={styles.pageIntroRow}>
            <h1 className={styles.title}>Admin Overview</h1>
            <span className={styles.dateText}>{liveDate}</span>
          </div>
        </div>

        {alerts.length > 0 ? (
          <div className={styles.alerts}>
            {alerts.map((alert) => (
              <div key={alert.id} className={`${styles.alert} ${alert.type === 'warn' ? styles.alertWarn : styles.alertInfo}`}>
                <span aria-hidden="true">{alert.type === 'warn' ? '⚠️' : '🔔'}</span>
                <span>{alert.message}</span>
                {alert.href ? (
                  <Link href={alert.href} className={styles.viewLink}>
                    Open
                  </Link>
                ) : null}
                <button
                  type="button"
                  className={styles.alertClose}
                  onClick={() => setAlerts((current) => current.filter((item) => item.id !== alert.id))}
                  aria-label="Dismiss alert"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.statsGrid}>
          <StatCard icon="📦" iconTone="green" value={stats.totalProducts} label="Products" sub="Live shop listings" />
          <StatCard icon="👥" iconTone="blue" value={stats.totalUsers} label="Customers" sub="Customers reached" />
          <StatCard icon="🛒" iconTone="amber" value={stats.totalOrders} label="Orders" sub="Orders received" />
          <StatCard icon="💰" iconTone="purple" value={Math.round(stats.revenue)} label="Revenue" sub="Paid order value" prefix="£" />
        </div>

        <div className={styles.row3}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Expiring Soon</h2>
              <Link href="/admin/products" className={styles.viewLink}>
                Manage
              </Link>
            </div>
            <div className={styles.expiryList}>
              {expiring.length === 0 ? (
                <p className={styles.emptyText}>No products are due to expire within 7 days.</p>
              ) : (
                expiring.map((product) => (
                  <div key={product.id} className={styles.expiryRow}>
                    <span className={styles.expiryEmoji}>{product.emoji}</span>
                    <span className={styles.expiryName}>{product.name}</span>
                    <span className={`${styles.expiryBadge} ${expiryClass(product.daysLeft)}`}>
                      {product.daysLeft === 0 ? 'Today' : `${product.daysLeft} day${product.daysLeft === 1 ? '' : 's'}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Product Categories</h2>
              <Link href="/admin/products" className={styles.viewLink}>
                Products
              </Link>
            </div>
            {categories.length === 0 ? (
              <p className={styles.emptyText}>No category data available yet.</p>
            ) : (
              <div className={styles.barChart}>
                {categories.map((cat, _index, list) => {
                  const max = Math.max(...list.map((item) => item.count), 1);
                  const height = Math.max(12, (cat.count / max) * 100);
                  return (
                    <div key={cat.name} className={styles.barCol}>
                      <div className={styles.bar} style={{ height: `${height}%`, background: '#e8f5eb' }}>
                        <span className={styles.barTooltip}>{cat.count}</span>
                      </div>
                      <div className={styles.barLabel}>{cat.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Shop Snapshot</h2>
              <Link href="/admin/analytics" className={styles.viewLink}>
                Analytics
              </Link>
            </div>
            <div className={styles.snapshotList}>
              <div className={styles.snapshotRow}>
                <span>Low stock alerts</span>
                <strong>{stats.lowStockCount}</strong>
              </div>
              <div className={styles.snapshotRow}>
                <span>Expiring this week</span>
                <strong>{expiring.length}</strong>
              </div>
              <div className={styles.snapshotRow}>
                <span>Total revenue</span>
                <strong>{formatCurrency(stats.revenue)}</strong>
              </div>
              <div className={styles.snapshotRow}>
                <span>Live listings</span>
                <strong>{stats.totalProducts}</strong>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.row4}>
          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2 className={styles.cardTitle}>Recent Orders</h2>
              <Link href="/admin/orders" className={styles.viewLink}>
                View all
              </Link>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Placed</th>
                    <th>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyCell}>
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.customer}</td>
                        <td className={styles.orderTotal}>{formatCurrency(order.total)}</td>
                        <td>
                          <span className={`${styles.statusPill} ${orderStatusClass(order.status)}`}>
                            {prettyStatus(order.status)}
                          </span>
                        </td>
                        <td>{relativeTime(order.createdAt)}</td>
                        <td>
                          <Link href={`/admin/orders/${order.refCode}`} className={styles.refLink}>
                            {order.refCode}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
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
                { icon: '➕', label: 'Add Product', href: '/admin/products/new' },
                { icon: '📦', label: 'Manage Products', href: '/admin/products' },
                { icon: '🛒', label: 'Manage Orders', href: '/admin/orders' },
                { icon: '📈', label: 'View Analytics', href: '/admin/analytics' },
                { icon: '👥', label: 'View Customers', href: '/admin/customers' },
              ].map((action) => (
                <Link key={action.label} href={action.href} className={styles.quickAction}>
                  <span className={styles.quickIcon}>{action.icon}</span>
                  <span className={styles.quickLabel}>{action.label}</span>
                  <span className={styles.quickArrow}>&rsaquo;</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
