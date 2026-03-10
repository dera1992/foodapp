'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AccountSidebar } from './AccountSidebar';
import type { Session } from '@/lib/auth/session';

export function AccountLayoutShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      <AccountSidebar
        session={session}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-slate-700">My Account</p>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
