'use client';

import { Bell, Menu } from 'lucide-react';

export function AdminTopbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="bf-admin-topbar-wrap">
      <button type="button" className="bf-admin-menu-btn" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
        <Menu className="h-5 w-5" />
      </button>
      <h1>Shop Analytics &amp; Reporting</h1>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Notifications" className="rounded-xl p-2 text-brand-muted hover:bg-slate-100">
          <Bell className="h-5 w-5" />
        </button>
        <span className="bf-admin-topbar-avatar">AD</span>
      </div>
    </header>
  );
}
