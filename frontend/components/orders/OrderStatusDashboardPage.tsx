'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type OrderStatusRow = {
  id: string;
  userName: string;
  orderedBy: string;
  email: string;
  product: string;
  phone: string;
  paid: boolean;
  status: string;
  refCode: string;
  createdAt?: string | null;
};

type Scope = 'admin' | 'shop' | 'customer';
type SortKey = 'userName' | 'orderedBy' | 'email' | 'product' | 'phone' | 'paid' | 'status' | 'refCode';

function normalizeStatus(status: string) {
  return status.toLowerCase().trim();
}

function prettyStatus(status: string) {
  const value = status.replace(/_/g, ' ').trim();
  return value ? value.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Order placed';
}

function isToday(dateLike?: string | null) {
  if (!dateLike) return false;
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function calcRing(count: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((count / total) * 100)));
}

function MiniRing({ percent, accentClass }: { percent: number; accentClass: string }) {
  return (
    <div
      className="relative h-28 w-28 rounded-full"
      style={{
        background: `conic-gradient(${accentClass} ${percent}%, #e5e7eb ${percent}% 100%)`
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-[5px] rounded-full bg-white" />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  percent,
  accentClass
}: {
  title: string;
  value: number;
  subtitle: string;
  percent: number;
  accentClass: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-medium text-slate-600">{title}</p>
          <p className="mt-5 text-4xl font-semibold text-black">{value}</p>
          <p className="mt-4 text-sm font-medium text-brand-text">{subtitle}</p>
        </div>
        <MiniRing percent={percent} accentClass={accentClass} />
      </div>
    </div>
  );
}

function ExportButton({ label, className }: { label: string; className: string }) {
  return (
    <button
      type="button"
      className={cn('inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-white', className)}
    >
      {label}
    </button>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', className)}>{children}</span>;
}

export function OrderStatusDashboardPage({
  orders,
  scope
}: {
  orders: OrderStatusRow[];
  scope: Scope;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'userName', dir: 'asc' });
  const pageSize = 10;

  const summary = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((row) => {
      const s = normalizeStatus(row.status);
      return s.includes('pending') || s.includes('process') || s === 'order placed' || s.includes('placed');
    }).length;
    const paid = orders.filter((row) => row.paid || normalizeStatus(row.status).includes('paid')).length;
    const delivered = orders.filter((row) => normalizeStatus(row.status).includes('deliver')).length;
    const todayPlaced = orders.filter((row) => isToday(row.createdAt)).length;
    return { total, pending, paid, delivered, todayPlaced };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? orders.filter((row) =>
          [row.userName, row.orderedBy, row.email, row.product, row.phone, row.status, row.refCode]
            .join(' ')
            .toLowerCase()
            .includes(q)
        )
      : orders;

    const sorted = [...rows].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      let result = 0;
      if (typeof left === 'boolean' && typeof right === 'boolean') result = Number(left) - Number(right);
      else result = String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      return sort.dir === 'asc' ? result : -result;
    });
    return sorted;
  }, [orders, query, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  const scopeLabel = scope === 'customer' ? 'My Food Orders' : 'Food Orders';

  const headerTitle = scope === 'customer' ? 'Order Status' : 'Order Status';

  const sortHeader = (label: string, key: SortKey) => (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-left font-semibold text-brand-text"
      onClick={() =>
        setSort((current) => (current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
      }
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
          <span className="text-brand-primary">{scope === 'customer' ? 'Account' : 'Admin'}</span> {'>'} <span className="text-brand-text">{scopeLabel}</span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Order Placed" value={summary.todayPlaced} subtitle="Today's Order" percent={calcRing(summary.todayPlaced, Math.max(1, summary.total))} accentClass="#f6b8be" />
        <StatCard title="Pending Orders" value={summary.pending} subtitle="In Process" percent={calcRing(summary.pending, Math.max(1, summary.total))} accentClass="#c4befd" />
        <StatCard title="Paid Orders" value={summary.paid} subtitle="Paid Today" percent={calcRing(summary.paid, Math.max(1, summary.total))} accentClass="#ffd2b0" />
        <StatCard title="Delivered" value={summary.delivered} subtitle="Delivered Today" percent={calcRing(summary.delivered, Math.max(1, summary.total))} accentClass="#b7e7a5" />
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton label="Copy" className="bg-neutral-600 hover:bg-neutral-700" />
            <ExportButton label="CSV" className="bg-cyan-500 hover:bg-cyan-600" />
            <ExportButton label="Excel" className="bg-green-500 hover:bg-green-600" />
            <ExportButton label="PDF" className="bg-pink-600 hover:bg-pink-700" />
            <ExportButton label="Print" className="bg-indigo-500 hover:bg-indigo-600" />
          </div>
          <label className="flex items-center gap-3 text-sm text-brand-text">
            <span>Search:</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="h-10 min-w-[220px] border-b border-brand-border bg-transparent px-2 outline-none focus:border-brand-primary"
              placeholder="Search orders..."
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left">
            <thead>
              <tr className="border-b border-brand-border text-sm">
                <th className="px-2 py-3">{sortHeader('User', 'userName')}</th>
                <th className="px-2 py-3">{sortHeader('Ordered By', 'orderedBy')}</th>
                <th className="px-2 py-3">{sortHeader('Email', 'email')}</th>
                <th className="px-2 py-3">{sortHeader('Product', 'product')}</th>
                <th className="px-2 py-3">{sortHeader('Phone', 'phone')}</th>
                <th className="px-2 py-3">{sortHeader('Paid', 'paid')}</th>
                <th className="px-2 py-3">{sortHeader('Status', 'status')}</th>
                <th className="px-2 py-3">{sortHeader('Ref Code', 'refCode')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => {
                  const initials = row.userName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase() || 'U';
                  const status = normalizeStatus(row.status);
                  return (
                    <tr key={row.id} className="border-b border-brand-border/70 text-sm">
                      <td className="px-2 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-200 text-sm font-semibold text-blue-800">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-brand-text">{row.userName || 'Unknown user'}</p>
                            {row.createdAt ? <p className="text-xs text-brand-muted">{new Date(row.createdAt).toLocaleDateString()}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-5 text-brand-text">{row.orderedBy || '--'}</td>
                      <td className="px-2 py-5 text-brand-text">{row.email || '--'}</td>
                      <td className="px-2 py-5 text-brand-text">{row.product || '--'}</td>
                      <td className="px-2 py-5 text-brand-text">{row.phone || '--'}</td>
                      <td className="px-2 py-5">
                        <Pill className={row.paid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-emerald-200 bg-white text-emerald-700'}>
                          {String(row.paid)}
                        </Pill>
                      </td>
                      <td className="px-2 py-5">
                        <Pill
                          className={
                            status.includes('deliver')
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : status.includes('cancel')
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : status.includes('paid')
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-blue-200 bg-blue-50 text-blue-700'
                          }
                        >
                          {prettyStatus(row.status)}
                        </Pill>
                      </td>
                      <td className="px-2 py-5 font-medium text-brand-text">{row.refCode || row.id}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-2 py-8 text-sm text-brand-text">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-brand-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {from} to {to} of {total} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
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
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
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

