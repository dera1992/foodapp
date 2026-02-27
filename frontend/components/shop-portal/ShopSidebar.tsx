'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type NavLink = { href: string; label: string; icon: string };

const links: NavLink[] = [
  { href: '/admin',              label: 'Dashboard',    icon: '📊' },
  { href: '/admin/analytics',    label: 'Analytics',    icon: '📈' },
  { href: '/admin/orders',       label: 'Orders',       icon: '📋' },
  { href: '/admin/products',     label: 'Products',     icon: '📦' },
  { href: '/admin/products/new', label: 'Add Product',  icon: '➕' },
  { href: '/admin/customers',    label: 'Customers',    icon: '👥' },
  { href: '/admin/followers',    label: 'Followers',    icon: '🔔' },
  { href: '/admin/integrations', label: 'Integrations', icon: '🔗' },
  { href: '/admin/plans',        label: 'My Plan',      icon: '⭐' },
  { href: '/admin/settings',     label: 'Settings',     icon: '⚙️' },
];

export function ShopSidebar({ open = false, shopName = 'My Shop', initials = 'SH' }: {
  open?: boolean;
  shopName?: string;
  initials?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className={cn('bf-admin-sidebar', open && 'open')}>
      <div className="bf-admin-sidebar-head">
        <Link href="/" className="bf-admin-logo">
          bunch<span>food</span>
        </Link>
        <p className="bf-admin-subtitle">Shop Portal</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <p className="bf-admin-nav-label">Navigation</p>
        {links.map((link) => {
          // Dashboard is active only on exact match; others use prefix match
          const isActive = link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn('bf-admin-nav-item', isActive && 'active')}
            >
              <span aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="bf-admin-sidebar-foot">
        <div className="bf-admin-user-avatar">{initials}</div>
        <div>
          <p className="text-sm font-semibold text-white">{shopName}</p>
          <p className="text-xs text-white/60">Shop Owner</p>
        </div>
      </div>
    </aside>
  );
}
