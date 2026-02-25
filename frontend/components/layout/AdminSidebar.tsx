'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type NavLink = {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
};

const links: NavLink[] = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/analytics', label: 'Shop Analytics', icon: '📈' },
  { href: '__DJANGO_ADMIN__', label: 'Admin', icon: '⚙️', external: true },
  { href: '/admin/orders', label: 'Order Status', icon: '📋' },
  { href: '/admin/products', label: 'Product List', icon: '📦' },
  { href: '/admin/products/new', label: 'Add Product', icon: '➕' },
  { href: '/admin/shops', label: 'Manage Shops', icon: '🏪' },
  { href: '/admin/customers', label: 'View Customers', icon: '👥' },
  { href: '/admin/users', label: 'Manage Users', icon: '👤' },
  { href: '/admin/plans', label: 'Sub. Plans', icon: '⭐' },
  { href: '/admin/followers', label: 'Followers', icon: '🔔' },
  { href: '/admin/integrations', label: 'Integrations', icon: '🔗' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' }
];

export function AdminSidebar({ open = false }: { open?: boolean }) {
  const pathname = usePathname();
  const djangoAdminHref = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '')}/admin/`;

  return (
    <aside className={cn('bf-admin-sidebar', open && 'open')}>
      <div className="bf-admin-sidebar-head">
        <p className="bf-admin-logo">
          bunch<span>food</span>
        </p>
        <p className="bf-admin-subtitle">Bunchfood Admin</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <p className="bf-admin-nav-label">Navigation</p>
        {links.map((link) => {
          const href = link.href === '__DJANGO_ADMIN__' ? djangoAdminHref : link.href;
          const isActive = !link.external && pathname === href;

          return (
            <Link
              key={`${link.href}-${link.label}`}
              href={href}
              className={cn('bf-admin-nav-item', isActive && 'active')}
              {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              <span aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="bf-admin-sidebar-foot">
        <div className="bf-admin-user-avatar">AD</div>
        <div>
          <p className="text-sm font-semibold text-white">Admin User</p>
          <p className="text-xs text-white/60">Hi, Admin</p>
        </div>
      </div>
    </aside>
  );
}

