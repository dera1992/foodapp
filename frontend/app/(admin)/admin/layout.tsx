'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopbar } from '@/components/layout/AdminTopbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bf-admin-layout">
      <AdminSidebar open={isSidebarOpen} />
      <div className="bf-admin-main">
        <AdminTopbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="bf-admin-content">{children}</main>
      </div>
    </div>
  );
}
