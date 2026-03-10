'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  Bell,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  PiggyBank,
  Settings,
  Truck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { authLogout } from '@/lib/api/endpoints';
import type { Session } from '@/lib/auth/session';

const NAV_ITEMS = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/orders', label: 'Track Order', icon: Truck },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/budget-planner', label: 'Budget', icon: PiggyBank },
  { href: '/account/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/settings', label: 'Settings', icon: Settings },
];

type Props = {
  session: Session;
  open: boolean;
  onClose: () => void;
};

export function AccountSidebar({ session, open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  const initials = (session.email ?? 'U')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    session.role === 'shop' ? 'Shop Owner'
    : session.role === 'dispatcher' ? 'Dispatcher'
    : session.role === 'admin' ? 'Admin'
    : 'Customer';

  async function handleLogout() {
    const match = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )refresh_token=([^;]*)/) : null;
    const refreshToken = match ? decodeURIComponent(match[1]) : '';
    await authLogout(refreshToken).catch(() => {});
    router.push('/login');
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-100 shadow-xl transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button (mobile only) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: '#16A34A', color: '#ffffff' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {session.email ?? 'My Account'}
            </p>
            <p className="text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                style={active ? { backgroundColor: '#16A34A', color: '#ffffff' } : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all w-full',
                  active
                    ? 'shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={active ? { color: '#ffffff' } : undefined}
                />
                <span className="flex-1 truncate">{label}</span>
                <ChevronRight
                  className={cn(
                    'h-3 w-3 shrink-0 transition-opacity',
                    active ? 'opacity-70' : 'opacity-0 group-hover:opacity-40'
                  )}
                  style={active ? { color: '#ffffff' } : undefined}
                />
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-100 px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
