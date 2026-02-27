'use client';

import { useState } from 'react';
import { DispatcherSidebar } from '@/components/dispatcher-portal/DispatcherSidebar';
import { DispatcherTopbar } from '@/components/dispatcher-portal/DispatcherTopbar';

export function DispatcherPortalLayout({ children, name, initials }: {
  children: React.ReactNode;
  name?: string;
  initials?: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bf-admin-layout">
      <DispatcherSidebar open={isSidebarOpen} name={name} initials={initials} />
      <div className="bf-admin-main">
        <DispatcherTopbar name={name} initials={initials} onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="bf-admin-content">{children}</main>
      </div>
    </div>
  );
}
