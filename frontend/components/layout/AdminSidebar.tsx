'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const links = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/analytics', label: 'Shop Analytics', icon: '📈' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
  { href: '/admin/orders', label: 'Order Status', icon: '📋' },
  { href: '/admin/orders', label: 'My Orders', icon: '🛍️' },
  { href: '/admin/products', label: 'Product List', icon: '📦' },
  { href: '/admin/products/new', label: 'Add Product', icon: '➕' },
  { href: '/admin/customers', label: 'View Customers', icon: '👥' }
];

export function AdminSidebar({ open = false }: { open?: boolean }) {
  const pathname = usePathname();

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
          const isActive = pathname === link.href;
          return (
            <Link key={`${link.href}-${link.label}`} href={link.href} className={cn('bf-admin-nav-item', isActive && 'active')}>
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
