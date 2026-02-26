'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Session } from '@/lib/auth/session';
import { duplicateFoodcreateProduct } from '@/lib/api/endpoints';
import type { Product } from '@/types/api';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/money';

type SortKey = 'id' | 'name' | 'category' | 'price' | 'status';
type SortDirection = 'asc' | 'desc';

type ProductRow = Product & {
  qty?: number | null;
};

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

function backendUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return base ? `${base}${path}` : path;
}

function normalizeStatus(status?: string | null) {
  const value = (status ?? '').toLowerCase();
  if (!value) return 'active';
  if (value.includes('out')) return 'out_of_stock';
  return value;
}

function prettyStatus(status?: string | null) {
  const value = normalizeStatus(status);
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusPillClass(status?: string | null) {
  const value = normalizeStatus(status);
  if (value === 'draft') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (value === 'expired') return 'bg-red-100 text-red-700 border-red-200';
  if (value === 'out_of_stock') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
}

async function deleteProductRequest(productId: string) {
  const csrf = getCookie('csrftoken');
  const urls = [
    `/api/products/${productId}/`,
    backendUrl(`/foodcreate/productss/${productId}/`),
    backendUrl(`/home/ads/${productId}/delete/`),
  ];

  let lastError: unknown;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrf ? { 'X-CSRFToken': csrf } : {})
        }
      });

      if (res.ok || res.status === 204) return;
      if (res.status === 404) continue;
      const text = await res.text();
      throw new Error(text || `Delete failed (${res.status})`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Delete failed');
}

export function AdminProductListPage({
  products,
  session
}: {
  products: ProductRow[];
  session: Session;
}) {
  const role = session.role;
  const isAdmin = role === 'admin';
  const isShop = role === 'shop';
  const canCreate = isShop;
  const [rows, setRows] = useState<ProductRow[]>(products);
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'id', direction: 'asc' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = q
      ? rows.filter((row) =>
          [row.id, row.name, row.category ?? '', row.shopName ?? '', row.status ?? '']
            .join(' ')
            .toLowerCase()
            .includes(q)
        )
      : rows;

    const sorted = [...next].sort((a, b) => {
      const getValue = (row: ProductRow) => {
        switch (sort.key) {
          case 'id':
            return row.id ?? '';
          case 'name':
            return row.name ?? '';
          case 'category':
            return row.category ?? '';
          case 'price':
            return row.price ?? 0;
          case 'status':
            return row.status ?? '';
        }
      };

      const left = getValue(a);
      const right = getValue(b);
      let result = 0;
      if (typeof left === 'number' && typeof right === 'number') result = left - right;
      else result = String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    });

    return sorted;
  }, [rows, query, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIndex = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(safePage * pageSize, total);

  const toggleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
    setPage(1);
  };

  const canManageProduct = (product: ProductRow) => {
    if (!isShop) return false;
    if (!product.shopId || !session.userId) return true;
    return String(product.shopId) === String(session.userId);
  };

  const onDelete = async (product: ProductRow) => {
    if (!canManageProduct(product)) return;
    const confirmDelete = window.confirm(`Delete "${product.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    setDeletingId(product.id);
    setError('');
    try {
      await deleteProductRequest(product.id);
      setRows((current) => current.filter((row) => row.id !== product.id));
    } catch {
      setError('Unable to delete product right now. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const onDuplicate = async (product: ProductRow) => {
    if (!canManageProduct(product)) return;
    setDuplicatingId(product.id);
    setError('');
    try {
      const duplicated = await duplicateFoodcreateProduct(product.id);
      setRows((current) => [duplicated as ProductRow, ...current]);
    } catch {
      setError('Unable to duplicate product right now. Please try again.');
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-brand-text">Product List</h1>
        <div className="text-sm text-brand-muted">
          <Link href="/admin" className="text-brand-primary hover:underline">
            Admin
          </Link>{' '}
          {'>'} <span className="text-brand-text">Product List</span>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-card sm:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-brand-text">Show</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-10 rounded-lg border border-brand-border bg-white px-3 text-sm"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-brand-text">entries</span>
            {canCreate ? (
              <Link href="/admin/products/new" className="ml-2">
                <Button size="sm">Add Product</Button>
              </Link>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-text">
            <span>Search:</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="h-10 min-w-[220px] rounded-lg border-b border-brand-border bg-transparent px-2 outline-none focus:border-brand-primary"
              placeholder="Search products..."
            />
          </label>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-brand-border">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-blue-100/80">
                <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-brand-text">
                  <button type="button" onClick={() => toggleSort('id')} className="inline-flex items-center gap-2">
                    ID
                    <ArrowUpDown className="h-4 w-4 text-brand-muted" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-brand-text">
                  <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-2">
                    Product
                    <ArrowUpDown className="h-4 w-4 text-brand-muted" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-brand-text">
                  <button type="button" onClick={() => toggleSort('category')} className="inline-flex items-center gap-2">
                    Category
                    <ArrowUpDown className="h-4 w-4 text-brand-muted" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-brand-text">
                  <button type="button" onClick={() => toggleSort('price')} className="inline-flex items-center gap-2">
                    Price
                    <ArrowUpDown className="h-4 w-4 text-brand-muted" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-brand-text">QTY</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-brand-text">
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-2">
                    Status
                    <ArrowUpDown className="h-4 w-4 text-brand-muted" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-brand-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-white">
              {paginated.length ? (
                paginated.map((product) => {
	                  const canManage = canManageProduct(product);
	                  const isDeleting = deletingId === product.id;
	                  const isDuplicating = duplicatingId === product.id;
                  return (
                    <tr key={product.id} className="align-middle hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-sm font-medium text-brand-text">{product.id || '--'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-brand-background">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-muted">
                                {(product.name || 'P').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-text">{product.name}</p>
                            {isAdmin && product.shopName ? <p className="text-xs text-brand-muted">{product.shopName}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-brand-text">{product.category || '--'}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-brand-primaryDark">{formatCurrency(product.price ?? 0)}</td>
                      <td className="px-4 py-4 text-sm text-brand-text">{typeof product.qty === 'number' ? product.qty : '--'}</td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', statusPillClass(product.status))}>
                          {prettyStatus(product.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="inline-flex h-9 items-center gap-1 rounded-lg border border-brand-border px-3 text-xs font-semibold text-brand-text hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                          {canManage ? (
                            <>
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => void onDuplicate(product)}
                                disabled={isDuplicating}
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void onDelete(product)}
                                disabled={isDeleting}
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-brand-muted">{isAdmin ? 'View only (admin)' : 'No permission'}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-7 text-left text-sm text-brand-text">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 text-sm text-brand-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {startIndex} to {endIndex} of {total} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-muted hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              PREVIOUS
            </button>
            <span className="rounded-lg bg-brand-background px-3 py-1.5 text-xs font-semibold text-brand-text">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-muted hover:bg-slate-100 disabled:opacity-40"
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
