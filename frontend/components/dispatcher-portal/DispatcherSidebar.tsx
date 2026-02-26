'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type NavLink = { href: string; label: string; icon: string };

const links: NavLink[] = [
  { href: '/dispatcher/dashboard', label: 'Dashboard',  icon: '📊' },
  { href: '/dispatcher/profile',   label: 'My Profile',  icon: '👤' },
  { href: '/messages',             label: 'Messages',    icon: '💬' },
];

export function DispatcherSidebar({ open = false, initials = 'DX', name = 'Dispatcher' }: {
  open?: boolean;
  initials?: string;
  name?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className={cn('bf-admin-sidebar', open && 'open')}>
      <div className="bf-admin-sidebar-head">
        <p className="bf-admin-logo">
          bunch<span>food</span>
        </p>
        <p className="bf-admin-subtitle">Dispatcher Portal</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <p className="bf-admin-nav-label">Navigation</p>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn('bf-admin-nav-item', pathname === link.href && 'active')}
          >
            <span aria-hidden="true">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="bf-admin-sidebar-foot">
        <div className="bf-admin-user-avatar">{initials}</div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-white/60">Dispatcher</p>
        </div>
      </div>
    </aside>
  );
}
