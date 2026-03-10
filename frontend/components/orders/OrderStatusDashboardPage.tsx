'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ChevronLeft, ChevronRight, CreditCard, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/money';

export type OrderStatusRow = {
  id: string;
  ref: string;
  userName: string;
  orderedBy: string;
  email: string;
  product: string;
  phone: string;
  paid: boolean;
  status: string;
  refCode: string;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  itemsCount: number;
  createdAt?: string | null;
};

type Scope = 'admin' | 'shop' | 'customer';
type SortKey = 'userName' | 'orderedBy' | 'email' | 'product' | 'phone' | 'paid' | 'status' | 'refCode' | 'total' | 'createdAt';

function prettyStatus(status: string) {
  const value = status.replace(/_/g, ' ').trim();
  return value ? value.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Order Placed';
}

function statusColors(status: string) {
  const s = status.toLowerCase();
  if (s.includes('deliver') || s.includes('received')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (s.includes('cancel')) return 'border-red-200 bg-red-50 text-red-700';
  if (s.includes('confirmed') || s.includes('paid')) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (s.includes('preparing')) return 'border-purple-200 bg-purple-50 text-purple-700';
  if (s.includes('out for') || s.includes('delivery')) return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function isToday(dateLike?: string | null) {
  if (!dateLike) return false;
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function calcRing(count: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((count / total) * 100)));
}

function MiniRing({ percent, color }: { percent: number; color: string }) {
  return (
    <div
      className="relative h-28 w-28 rounded-full"
      style={{ background: `conic-gradient(${color} ${percent}%, #e5e7eb ${percent}% 100%)` }}
      aria-hidden="true"
    >
      <div className="absolute inset-[5px] rounded-full bg-white" />
    </div>
  );
}

function StatCard({ title, value, subtitle, percent, color }: { title: string; value: string | number; subtitle: string; percent: number; color: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-medium text-slate-600">{title}</p>
          <p className="mt-5 text-4xl font-semibold text-black">{value}</p>
          <p className="mt-4 text-sm font-medium text-brand-text">{subtitle}</p>
        </div>
        <MiniRing percent={percent} color={color} />
      </div>
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', className)}>{children}</span>;
}

export function OrderStatusDashboardPage({ orders, scope }: { orders: OrderStatusRow[]; scope: Scope }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const pageSize = 10;

  const summary = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((r) => {
      const s = r.status.toLowerCase();
      return s.includes('placed') || s.includes('pending') || s.includes('process');
    }).length;
    const paid = orders.filter((r) => r.paid || r.status.toLowerCase().includes('paid')).length;
    const delivered = orders.filter((r) => r.status.toLowerCase().includes('deliver')).length;
    const todayPlaced = orders.filter((r) => isToday(r.createdAt)).length;
    const revenue = orders.filter((r) => r.paid).reduce((sum, r) => sum + r.total, 0);
    return { total, pending, paid, delivered, todayPlaced, revenue };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? orders.filter((r) =>
          [r.userName, r.orderedBy, r.email, r.product, r.phone, r.status, r.refCode]
            .join(' ')
            .toLowerCase()
            .includes(q)
        )
      : orders;

    return [...rows].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      let result = 0;
      if (typeof left === 'boolean' && typeof right === 'boolean') result = Number(left) - Number(right);
      else if (typeof left === 'number' && typeof right === 'number') result = left - right;
      else result = String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      return sort.dir === 'asc' ? result : -result;
    });
  }, [orders, query, sort]);

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const from = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = totalEntries === 0 ? 0 : Math.min(currentPage * pageSize, totalEntries);

  const headerTitle = scope === 'customer' ? 'My Transactions' : scope === 'shop' ? 'Shop Orders' : 'All Orders';
  const scopeLabel = scope === 'customer' ? 'My Orders' : 'Orders';

  const sortHeader = (label: string, key: SortKey) => (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-left font-semibold text-brand-text"
      onClick={() => setSort((cur) => (cur.key === key ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))}
    >
      {label}
      <ArrowUpDown className="h-4 w-4 text-brand-muted" />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-black">{headerTitle}</h1>
        <div className="text-sm text-brand-muted">
          <span className="text-brand-primary">{scope === 'customer' ? 'Account' : 'Admin'}</span>
          {' > '}
          <span className="text-brand-text">{scopeLabel}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Orders"
          value={summary.todayPlaced}
          subtitle="Placed today"
          percent={calcRing(summary.todayPlaced, Math.max(1, summary.total))}
          color="#f6b8be"
        />
        <StatCard
          title="Pending"
          value={summary.pending}
          subtitle="Awaiting fulfilment"
          percent={calcRing(summary.pending, Math.max(1, summary.total))}
          color="#c4befd"
        />
        <StatCard
          title="Delivered"
          value={summary.delivered}
          subtitle="Successfully delivered"
          percent={calcRing(summary.delivered, Math.max(1, summary.total))}
          color="#b7e7a5"
        />
        <StatCard
          title={scope === 'customer' ? 'Total Spent' : 'Revenue'}
          value={formatCurrency(summary.revenue)}
          subtitle="From paid orders"
          percent={calcRing(summary.paid, Math.max(1, summary.total))}
          color="#ffd2b0"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-brand-muted">
            <span className="font-semibold text-black">{summary.total}</span> total orders
          </p>
          <label className="flex items-center gap-3 text-sm text-brand-text">
            <span>Search:</span>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="h-10 min-w-[220px] border-b border-brand-border bg-transparent px-2 outline-none focus:border-brand-primary"
              placeholder="Name, ref, product…"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1040px] w-full text-left">
            <thead>
              <tr className="border-b border-brand-border text-sm">
                <th className="px-3 py-3">{sortHeader(scope === 'customer' ? 'Shop' : 'Customer', 'userName')}</th>
                <th className="px-3 py-3">{sortHeader('Items', 'product')}</th>
                <th className="px-3 py-3">{sortHeader('Total', 'total')}</th>
                <th className="px-3 py-3 hidden sm:table-cell">{sortHeader('Payment', 'paid')}</th>
                <th className="px-3 py-3">{sortHeader('Status', 'status')}</th>
                <th className="px-3 py-3 hidden md:table-cell">{sortHeader('Date', 'createdAt')}</th>
                <th className="px-3 py-3">{sortHeader('Ref', 'refCode')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const initials = row.userName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase() || 'U';

                  const detailHref =
                    scope === 'customer'
                      ? `/account/orders/${row.refCode}`
                      : `/admin/orders/${row.refCode}`;

                  return (
                    <tr key={row.id} className="border-b border-brand-border/60 text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-brand-text">{row.userName || 'Unknown'}</p>
                            <p className="truncate text-xs text-brand-muted">{row.email || row.phone || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 max-w-[200px]">
                        <p className="truncate text-brand-text">{row.product || '—'}</p>
                        {row.itemsCount > 0 && (
                          <p className="text-xs text-brand-muted">{row.itemsCount} item{row.itemsCount !== 1 ? 's' : ''}</p>
                        )}
                      </td>
                      <td className="px-3 py-4 font-semibold text-brand-text whitespace-nowrap">
                        {row.total > 0 ? formatCurrency(row.total) : '—'}
                      </td>
                      <td className="px-3 py-4 hidden sm:table-cell">
                        <div className="flex flex-col gap-1">
                          <Pill className={row.paid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}>
                            {row.paid ? 'Paid' : 'Unpaid'}
                          </Pill>
                          {row.paymentMethod && (
                            <span className="flex items-center gap-1 text-xs text-brand-muted capitalize">
                              <CreditCard className="h-3 w-3" />
                              {row.paymentMethod}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <Pill className={statusColors(row.status)}>
                          {prettyStatus(row.status)}
                        </Pill>
                      </td>
                      <td className="px-3 py-4 hidden md:table-cell text-brand-muted whitespace-nowrap">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          href={detailHref}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-primary/20 transition-colors"
                        >
                          <Package className="h-3.5 w-3.5" />
                          {row.refCode ? row.refCode.slice(0, 8) + '…' : row.id}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-sm text-brand-muted">
                    <Truck className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-brand-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Showing {from} to {to} of {totalEntries} entries</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              PREVIOUS
            </button>
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-blue-600 px-3 text-sm font-semibold text-white">
              {currentPage}
            </span>
            <button
              type="button"
              onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-100 disabled:opacity-40"
            >
              NEXT
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
