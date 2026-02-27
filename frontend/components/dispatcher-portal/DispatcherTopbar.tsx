'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Mail, Menu } from 'lucide-react';
import { authLogout, getThreads } from '@/lib/api/endpoints';

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={12} height={12} aria-hidden="true">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

const dispatcherLinks = [
  { href: '/',                     icon: '🏠', label: 'Go to Home' },
  { href: '/dispatcher/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dispatcher/profile',   icon: '👤', label: 'My Profile' },
  { href: '/messages',             icon: '💬', label: 'Messages' },
  { href: '/dispatcher/settings',  icon: '⚙️', label: 'Settings' },
];

export function DispatcherTopbar({ title = 'Dispatcher Portal', name = 'Dispatcher', initials = 'DX', onToggleSidebar }: {
  title?: string;
  name?: string;
  initials?: string;
  onToggleSidebar: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const threads = await getThreads().then((r) => r.data);
        if (!active) return;
        setUnread(threads.reduce((s, t) => s + (t.unreadCount ?? 0), 0));
      } catch { /* silent */ }
    };
    load();
    const id = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDropdownOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    const match = document.cookie.match(/(?:^|; )refresh_token=([^;]*)/);
    const refreshToken = match ? decodeURIComponent(match[1]) : '';
    if (refreshToken) { try { await authLogout(refreshToken); } catch { /* ignore */ } }
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <header className="bf-admin-topbar-wrap">
      <button type="button" className="bf-admin-menu-btn" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
        <Menu className="h-5 w-5" />
      </button>
      <h1>{title}</h1>
      <div className="flex items-center gap-2">
        {/* Messages */}
        <Link href="/messages" className="relative rounded-xl p-2 text-brand-muted hover:bg-slate-100" aria-label="Messages">
          <Mail className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100"
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
          >
            <div className="bf-admin-topbar-avatar">{initials}</div>
            <span className="hidden text-sm font-medium text-brand-text sm:block">{name}</span>
            <ChevronDown className={`h-4 w-4 text-brand-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="bf-account-dropdown absolute right-0 top-full z-50 mt-1 w-56" role="menu">
              <div className="bf-dd-head">
                <div className="bf-dd-av-lg">{initials}</div>
                <div className="bf-dd-fullname">{name}</div>
                <div className="bf-dd-role"><div className="bf-dd-role-dot" />Dispatcher</div>
              </div>
              <div className="bf-dd-nav">
                {dispatcherLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="bf-dd-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="bf-dd-ic">{link.icon}</div>
                    <span className="bf-dd-lbl">{link.label}</span>
                    <ChevronRightIcon />
                  </Link>
                ))}
                <div className="bf-dd-sep" />
                <button type="button" className="bf-dd-item bf-dd-item-out w-full" role="menuitem" onClick={handleLogout}>
                  <div className="bf-dd-ic">🚪</div>
                  <span className="bf-dd-lbl">Log Out</span>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
