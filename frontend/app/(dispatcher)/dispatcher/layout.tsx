'use client';

import { useState } from 'react';
import { DispatcherSidebar } from '@/components/dispatcher-portal/DispatcherSidebar';
import { DispatcherTopbar } from '@/components/dispatcher-portal/DispatcherTopbar';

export default function DispatcherLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bf-admin-layout">
      <DispatcherSidebar open={isSidebarOpen} />
      <div className="bf-admin-main">
        <DispatcherTopbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="bf-admin-content">{children}</main>
      </div>
    </div>
  );
}
